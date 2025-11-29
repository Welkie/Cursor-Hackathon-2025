import { Transaction, Subscription } from '@/types'
import { format, addMonths, addYears } from 'date-fns'

/**
 * Detect recurring subscriptions based on transaction patterns
 * Looks for repeated merchant/category combinations with similar amounts
 */
export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const subscriptions: Subscription[] = []
  const subscriptionMap = new Map<string, {
    transactions: Transaction[]
    merchant?: string
    category: string
    amounts: number[]
  }>()

  // Group transactions by merchant and category
  // Prioritize transactions explicitly marked as subscriptions
  // Filter out cancelled subscriptions (those with endDate in the past)
  const today = new Date().toISOString().split('T')[0]
  const subscriptionTransactions = transactions.filter((t) => {
    if (t.type !== 'expense' || !t.isSubscription) return false
    // Exclude if subscription has ended
    if (t.subscriptionEndDate && t.subscriptionEndDate < today) return false
    return true
  })
  // Include all expense transactions for pattern detection (not just unmarked ones)
  // This allows detection even if some transactions aren't explicitly marked
  const regularTransactions = transactions.filter((t) => {
    if (t.type !== 'expense') return false
    // Include transactions that aren't marked as subscriptions, or are marked but cancelled
    if (t.isSubscription) {
      // Only include if cancelled (for historical pattern detection)
      return t.subscriptionEndDate && t.subscriptionEndDate < today
    }
    return true
  })
  
  // Process subscription-marked transactions first
  subscriptionTransactions.forEach((transaction) => {
    const key = transaction.merchant 
      ? `${transaction.merchant}_${transaction.category}`
      : transaction.category
    
    if (!subscriptionMap.has(key)) {
      subscriptionMap.set(key, {
        transactions: [],
        merchant: transaction.merchant,
        category: transaction.category,
        amounts: [],
      })
    }

    const entry = subscriptionMap.get(key)!
    entry.transactions.push(transaction)
    entry.amounts.push(transaction.amount)
  })

  // Then process regular transactions
  regularTransactions.forEach((transaction) => {
    const key = transaction.merchant 
      ? `${transaction.merchant}_${transaction.category}`
      : transaction.category
    
    if (!subscriptionMap.has(key)) {
      subscriptionMap.set(key, {
        transactions: [],
        merchant: transaction.merchant,
        category: transaction.category,
        amounts: [],
      })
    }

    const entry = subscriptionMap.get(key)!
    entry.transactions.push(transaction)
    entry.amounts.push(transaction.amount)
  })

  // Analyze patterns to detect subscriptions
  subscriptionMap.forEach((data, key) => {
    // Check if any transactions are explicitly marked as subscriptions
    const hasExplicitSubscriptions = data.transactions.some((t) => t.isSubscription)
    
    // If explicitly marked, only need 1 transaction; otherwise need at least 2
    if (!hasExplicitSubscriptions && data.transactions.length < 2) return

    // Sort transactions by date
    const sortedTransactions = data.transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate average amount
    const avgAmount = data.amounts.reduce((sum, a) => sum + a, 0) / data.amounts.length
    
    // Check if amounts are similar (within variance threshold)
    // Skip variance check if only one transaction and explicitly marked (single transaction subscriptions)
    if (hasExplicitSubscriptions && data.amounts.length === 1) {
      // Single transaction marked as subscription - proceed without variance check
    } else if (data.amounts.length > 1) {
      // For multiple transactions, check variance
      const varianceThreshold = hasExplicitSubscriptions ? 0.25 : 0.15 // More lenient thresholds
      // Handle edge case where avgAmount is 0 or very small
      if (avgAmount > 0.01) { // Use small threshold instead of 0
        const isSimilarAmount = data.amounts.every(
          (amount) => {
            const variance = Math.abs(amount - avgAmount) / avgAmount
            return variance < varianceThreshold
          }
        )
        if (!isSimilarAmount) return
      } else {
        // If average is too small, check if all amounts are the same (exact match)
        const allSame = data.amounts.every(amount => amount === data.amounts[0])
        if (!allSame) return
      }
    }

    // Check date intervals to determine frequency
    const intervals: number[] = []
    for (let i = 1; i < sortedTransactions.length; i++) {
      const daysDiff =
        (new Date(sortedTransactions[i].date).getTime() -
          new Date(sortedTransactions[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24)
      intervals.push(daysDiff)
    }

    const avgInterval = intervals.length > 0 
      ? intervals.reduce((sum, i) => sum + i, 0) / intervals.length
      : 30 // Default to monthly if only one transaction marked as subscription

    // Determine frequency
    let frequency: 'monthly' | 'yearly' = 'monthly'
    if (hasExplicitSubscriptions && intervals.length === 0) {
      // If explicitly marked but only one transaction, default to monthly
      frequency = 'monthly'
    } else if (intervals.length > 0) {
      // We have interval data to analyze
      if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = 'monthly'
      } else if (avgInterval >= 350 && avgInterval <= 380) {
        frequency = 'yearly'
      } else if (avgInterval >= 20 && avgInterval < 25) {
        // Slightly more frequent than monthly, but still could be monthly (allow it)
        frequency = 'monthly'
      } else if (avgInterval > 35 && avgInterval < 45) {
        // Slightly less frequent than monthly, but still could be monthly (allow it)
        frequency = 'monthly'
      } else if (avgInterval < 20 && !hasExplicitSubscriptions) {
        // Too frequent for monthly subscription (unless explicitly marked)
        // But allow if we have at least 2 transactions with similar amounts
        if (data.transactions.length < 2) {
          return
        }
        // For frequent transactions, still allow if explicitly marked
        frequency = 'monthly'
      } else {
        // Default to monthly for other intervals (more lenient)
        frequency = 'monthly'
      }
    } else {
      // No intervals (single transaction or same-day transactions)
      // Default to monthly for explicitly marked subscriptions
      if (!hasExplicitSubscriptions) {
        return // Need at least 2 transactions for unmarked subscriptions
      }
      frequency = 'monthly'
    }

    // Get the most recent transaction date
    const lastTransaction = sortedTransactions[sortedTransactions.length - 1]
    const lastDate = new Date(lastTransaction.date)

    // Calculate next billing date
    const nextBillingDate =
      frequency === 'monthly'
        ? format(addMonths(lastDate, 1), 'yyyy-MM-dd')
        : format(addYears(lastDate, 1), 'yyyy-MM-dd')

    // Determine subscription start and end dates
    const subscriptionStartDate = sortedTransactions[0].subscriptionStartDate || sortedTransactions[0].date
    const subscriptionEndDate = sortedTransactions[0].subscriptionEndDate

    // Create subscription
    const subscription: Subscription = {
      id: `sub_${key}_${Date.now()}`,
      name: data.merchant || data.category,
      amount: Math.round(avgAmount * 100) / 100,
      category: data.category,
      frequency,
      nextBillingDate,
      detectedFrom: sortedTransactions.map((t) => t.id),
      subscriptionStartDate,
      subscriptionEndDate,
    }

    subscriptions.push(subscription)
  })

  // Remove duplicates (same merchant/category/amount)
  // Use a more lenient comparison - same name and category is enough (amount might vary slightly)
  const uniqueSubscriptions = subscriptions.filter(
    (sub, index, self) =>
      index ===
      self.findIndex(
        (s) => s.name === sub.name && s.category === sub.category
      )
  )

  return uniqueSubscriptions
}

