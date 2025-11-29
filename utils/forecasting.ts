import { Transaction } from '@/types'
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  differenceInDays,
  isSameMonth,
  parseISO,
  isAfter,
  isBefore,
  format
} from 'date-fns'

export interface RecurringTransaction {
  category: string
  merchant?: string
  averageAmount: number
  frequency: 'monthly' | 'weekly' | 'biweekly'
  occurrences: number
  nextExpectedDate?: string
  type: 'expense' | 'income'
}

export interface ForecastResult {
  currentBalance: number
  projectedEOMBalance: number
  projectedIncome: number
  projectedExpenses: number
  recurringExpenses: RecurringTransaction[]
  recurringIncome: RecurringTransaction[]
  averageDailySpending: number
  remainingDays: number
  projectedVariableSpending: number
  confidence: 'high' | 'medium' | 'low'
  insights: string[]
}

/**
 * Analyzes 6 months of transaction history to forecast End-of-Month balance
 */
export function forecastEndOfMonthBalance(
  transactions: Transaction[],
  currentBalance?: number
): ForecastResult {
  const today = new Date()
  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  const sixMonthsAgo = subMonths(today, 6)
  
  // Calculate remaining days in month
  const remainingDays = differenceInDays(currentMonthEnd, today)
  
  // Filter transactions from the past 6 months
  const historicalTransactions = transactions.filter(t => {
    const date = parseISO(t.date)
    return isAfter(date, sixMonthsAgo) && isBefore(date, today)
  })
  
  // Get current month transactions (already occurred)
  const currentMonthTransactions = transactions.filter(t => {
    const date = parseISO(t.date)
    return isSameMonth(date, today) && isBefore(date, today)
  })
  
  // Calculate current balance from transactions if not provided
  const calculatedCurrentBalance = currentBalance ?? calculateBalanceFromTransactions(transactions)
  
  // Step 1: Identify recurring transactions
  const { recurringExpenses, recurringIncome } = identifyRecurringTransactions(historicalTransactions)
  
  // Step 2: Calculate average daily spending (excluding recurring)
  const averageDailySpending = calculateAverageDailySpending(historicalTransactions, recurringExpenses)
  
  // Step 3: Project recurring transactions for remainder of month
  const projectedRecurringExpenses = projectRecurringToEOM(recurringExpenses, currentMonthTransactions, today, currentMonthEnd)
  const projectedRecurringIncome = projectRecurringToEOM(recurringIncome, currentMonthTransactions, today, currentMonthEnd)
  
  // Step 4: Project variable spending
  const projectedVariableSpending = averageDailySpending * remainingDays
  
  // Step 5: Calculate totals
  const projectedExpenses = projectedRecurringExpenses + projectedVariableSpending
  const projectedIncome = projectedRecurringIncome
  
  // Step 6: Calculate projected EOM balance
  const projectedEOMBalance = calculatedCurrentBalance + projectedIncome - projectedExpenses
  
  // Step 7: Determine confidence level
  const confidence = determineConfidence(historicalTransactions.length, recurringExpenses.length)
  
  // Step 8: Generate insights
  const insights = generateForecastInsights({
    projectedEOMBalance,
    calculatedCurrentBalance,
    averageDailySpending,
    recurringExpenses,
    projectedVariableSpending,
    remainingDays
  })
  
  return {
    currentBalance: calculatedCurrentBalance,
    projectedEOMBalance: Math.round(projectedEOMBalance * 100) / 100,
    projectedIncome: Math.round(projectedRecurringIncome * 100) / 100,
    projectedExpenses: Math.round(projectedExpenses * 100) / 100,
    recurringExpenses,
    recurringIncome,
    averageDailySpending: Math.round(averageDailySpending * 100) / 100,
    remainingDays,
    projectedVariableSpending: Math.round(projectedVariableSpending * 100) / 100,
    confidence,
    insights
  }
}

/**
 * Calculate balance from all transactions
 */
function calculateBalanceFromTransactions(transactions: Transaction[]): number {
  return transactions.reduce((balance, t) => {
    return t.type === 'income' ? balance + t.amount : balance - t.amount
  }, 0)
}

/**
 * Identify recurring transactions by analyzing patterns
 */
function identifyRecurringTransactions(transactions: Transaction[]): {
  recurringExpenses: RecurringTransaction[]
  recurringIncome: RecurringTransaction[]
} {
  // Group transactions by category and merchant
  const groupedTransactions = new Map<string, Transaction[]>()
  
  transactions.forEach(t => {
    const key = `${t.type}:${t.category}:${t.merchant || 'unknown'}`
    const existing = groupedTransactions.get(key) || []
    existing.push(t)
    groupedTransactions.set(key, existing)
  })
  
  const recurringExpenses: RecurringTransaction[] = []
  const recurringIncome: RecurringTransaction[] = []
  
  groupedTransactions.forEach((txns, key) => {
    // Need at least 2 occurrences to be considered recurring
    if (txns.length < 2) return
    
    const [type, category, merchant] = key.split(':')
    
    // Calculate average amount
    const amounts = txns.map(t => t.amount)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    
    // Check for consistency (amounts within 20% of average)
    const isConsistent = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.2)
    
    // Check frequency by analyzing dates
    const dates = txns.map(t => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime())
    const intervals: number[] = []
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]))
    }
    
    if (intervals.length === 0) return
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    
    // Determine frequency
    let frequency: 'monthly' | 'weekly' | 'biweekly' = 'monthly'
    if (avgInterval <= 10) frequency = 'weekly'
    else if (avgInterval <= 20) frequency = 'biweekly'
    
    // Only include if it seems recurring (consistent and regular)
    if (isConsistent && txns.length >= 2) {
      const recurring: RecurringTransaction = {
        category,
        merchant: merchant !== 'unknown' ? merchant : undefined,
        averageAmount: Math.round(avgAmount * 100) / 100,
        frequency,
        occurrences: txns.length,
        type: type as 'expense' | 'income'
      }
      
      if (type === 'expense') {
        recurringExpenses.push(recurring)
      } else {
        recurringIncome.push(recurring)
      }
    }
  })
  
  return { recurringExpenses, recurringIncome }
}

/**
 * Calculate average daily spending excluding recurring transactions
 */
function calculateAverageDailySpending(
  transactions: Transaction[],
  recurringExpenses: RecurringTransaction[]
): number {
  const recurringKeys = new Set(
    recurringExpenses.map(r => `${r.category}:${r.merchant || 'unknown'}`)
  )
  
  // Filter out recurring expenses
  const variableExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false
    const key = `${t.category}:${t.merchant || 'unknown'}`
    return !recurringKeys.has(key)
  })
  
  if (variableExpenses.length === 0) return 0
  
  // Calculate total variable spending
  const totalVariable = variableExpenses.reduce((sum, t) => sum + t.amount, 0)
  
  // Calculate number of days in the dataset
  const dates = variableExpenses.map(t => parseISO(t.date))
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 1)
  
  return totalVariable / totalDays
}

/**
 * Project recurring transactions to end of month
 */
function projectRecurringToEOM(
  recurring: RecurringTransaction[],
  currentMonthTransactions: Transaction[],
  today: Date,
  monthEnd: Date
): number {
  let projectedTotal = 0
  
  recurring.forEach(r => {
    // Check if this recurring transaction already happened this month
    const alreadyOccurred = currentMonthTransactions.some(t => 
      t.category === r.category && 
      (r.merchant ? t.merchant === r.merchant : true)
    )
    
    // If monthly and hasn't occurred yet, add to projection
    if (r.frequency === 'monthly' && !alreadyOccurred) {
      projectedTotal += r.averageAmount
    }
    
    // For weekly/biweekly, estimate remaining occurrences
    if (r.frequency === 'weekly') {
      const remainingWeeks = Math.floor(differenceInDays(monthEnd, today) / 7)
      projectedTotal += r.averageAmount * remainingWeeks
    }
    
    if (r.frequency === 'biweekly') {
      const remainingBiweeks = Math.floor(differenceInDays(monthEnd, today) / 14)
      projectedTotal += r.averageAmount * remainingBiweeks
    }
  })
  
  return projectedTotal
}

/**
 * Determine forecast confidence based on data quality
 */
function determineConfidence(
  totalTransactions: number,
  recurringCount: number
): 'high' | 'medium' | 'low' {
  if (totalTransactions >= 50 && recurringCount >= 3) return 'high'
  if (totalTransactions >= 20 && recurringCount >= 1) return 'medium'
  return 'low'
}

/**
 * Generate human-readable insights from forecast
 */
function generateForecastInsights(data: {
  projectedEOMBalance: number
  calculatedCurrentBalance: number
  averageDailySpending: number
  recurringExpenses: RecurringTransaction[]
  projectedVariableSpending: number
  remainingDays: number
}): string[] {
  const insights: string[] = []
  
  // Balance trend
  if (data.projectedEOMBalance < 0) {
    insights.push(`⚠️ Warning: Projected to end the month with a negative balance of $${Math.abs(data.projectedEOMBalance).toFixed(2)}`)
  } else if (data.projectedEOMBalance < data.calculatedCurrentBalance * 0.2) {
    insights.push(`⚠️ Balance expected to decrease significantly by end of month`)
  } else {
    insights.push(`✅ On track to end the month with $${data.projectedEOMBalance.toFixed(2)}`)
  }
  
  // Daily spending insight
  insights.push(`📊 Your average daily spending is $${data.averageDailySpending.toFixed(2)}`)
  
  // Remaining days
  if (data.remainingDays > 0) {
    insights.push(`📅 ${data.remainingDays} days remaining this month`)
  }
  
  // Projected variable spending
  if (data.projectedVariableSpending > 0) {
    insights.push(`💳 Estimated variable spending: $${data.projectedVariableSpending.toFixed(2)}`)
  }
  
  // Top recurring expenses
  if (data.recurringExpenses.length > 0) {
    const topRecurring = data.recurringExpenses
      .sort((a, b) => b.averageAmount - a.averageAmount)
      .slice(0, 3)
    
    const recurringTotal = topRecurring.reduce((sum, r) => sum + r.averageAmount, 0)
    insights.push(`🔄 ${data.recurringExpenses.length} recurring expenses detected (~$${recurringTotal.toFixed(2)}/month)`)
  }
  
  return insights
}

/**
 * Get a summary string for quick display
 */
export function getForecastSummary(forecast: ForecastResult): string {
  const { projectedEOMBalance, remainingDays, confidence } = forecast
  const confidenceEmoji = confidence === 'high' ? '🎯' : confidence === 'medium' ? '📊' : '📈'
  
  return `${confidenceEmoji} Projected EOM Balance: $${projectedEOMBalance.toFixed(2)} (${remainingDays} days left)`
}

