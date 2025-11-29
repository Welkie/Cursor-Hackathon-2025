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
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((transaction) => {
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
    // Need at least 2 transactions to be considered a subscription
    if (data.transactions.length < 2) return

    // Sort transactions by date
    const sortedTransactions = data.transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Check if amounts are similar (within 10% variance)
    const avgAmount = data.amounts.reduce((sum, a) => sum + a, 0) / data.amounts.length
    const isSimilarAmount = data.amounts.every(
      (amount) => Math.abs(amount - avgAmount) / avgAmount < 0.1
    )

    if (!isSimilarAmount) return

    // Check date intervals to determine frequency
    const intervals: number[] = []
    for (let i = 1; i < sortedTransactions.length; i++) {
      const daysDiff =
        (new Date(sortedTransactions[i].date).getTime() -
          new Date(sortedTransactions[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24)
      intervals.push(daysDiff)
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length

    // Determine frequency
    let frequency: 'monthly' | 'yearly' = 'monthly'
    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'monthly'
    } else if (avgInterval >= 350 && avgInterval <= 380) {
      frequency = 'yearly'
    } else if (avgInterval < 25) {
      // Too frequent, might not be a subscription
      return
    } else {
      // Default to monthly for other intervals
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

    // Create subscription
    const subscription: Subscription = {
      id: `sub_${key}_${Date.now()}`,
      name: data.merchant || data.category,
      amount: Math.round(avgAmount * 100) / 100,
      category: data.category,
      frequency,
      nextBillingDate,
      detectedFrom: sortedTransactions.map((t) => t.id),
    }

    subscriptions.push(subscription)
  })

  // Remove duplicates (same merchant/category)
  const uniqueSubscriptions = subscriptions.filter(
    (sub, index, self) =>
      index ===
      self.findIndex(
        (s) => s.name === sub.name && s.category === sub.category && s.amount === sub.amount
      )
  )

  return uniqueSubscriptions
}

