import { Transaction, Insight } from '@/types'
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

/**
 * Generate AI-style insights based on transaction patterns
 * These are rule-based but designed to feel like AI-generated insights
 */
export function generateInsights(transactions: Transaction[]): Insight[] {
  const insights: Insight[] = []
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastWeekStart = subDays(now, 7)
  const lastMonthStart = startOfMonth(subDays(now, 30))

  // Filter transactions
  const thisMonthTransactions = transactions.filter((t) =>
    isWithinInterval(new Date(t.date), { start: thisMonthStart, end: thisMonthEnd })
  )
  const lastWeekTransactions = transactions.filter((t) =>
    new Date(t.date) >= lastWeekStart
  )
  const lastMonthTransactions = transactions.filter((t) =>
    isWithinInterval(new Date(t.date), { start: lastMonthStart, end: thisMonthStart })
  )

  // Insight 1: Spending comparison with last week
  const thisWeekSpending = lastWeekTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const previousWeekSpending = transactions
    .filter((t) => {
      const date = new Date(t.date)
      return date >= subDays(lastWeekStart, 7) && date < lastWeekStart && t.type === 'expense'
    })
    .reduce((sum, t) => sum + t.amount, 0)

  if (previousWeekSpending > 0) {
    const change = ((thisWeekSpending - previousWeekSpending) / previousWeekSpending) * 100
    if (Math.abs(change) > 10) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'spending',
        message: change > 0
          ? `You spent ${change.toFixed(0)}% more than last week. Consider reviewing your recent purchases.`
          : `Great job! You spent ${Math.abs(change).toFixed(0)}% less than last week.`,
        severity: change > 0 ? 'warning' : 'success',
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Insight 2: Biggest expense category
  const categoryTotals: Record<string, number> = {}
  thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
  if (topCategory && topCategory[1] > 0) {
    insights.push({
      id: `insight_${Date.now()}_2`,
      type: 'category',
      message: `Your biggest expense category this month is ${topCategory[0]} ($${topCategory[1].toFixed(2)}).`,
      severity: 'info',
      createdAt: new Date().toISOString(),
    })
  }

  // Insight 3: Monthly budget warning
  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const thisMonthIncome = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  if (thisMonthIncome > 0) {
    const spendingRatio = (thisMonthExpenses / thisMonthIncome) * 100
    if (spendingRatio > 80) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'budget',
        message: `You're spending ${spendingRatio.toFixed(0)}% of your income this month. Consider reducing expenses to build savings.`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
      })
    } else if (spendingRatio < 50) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: 'budget',
        message: `Excellent! You're only spending ${spendingRatio.toFixed(0)}% of your income. Great savings potential!`,
        severity: 'success',
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Insight 4: Trend analysis
  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  if (lastMonthExpenses > 0) {
    const trend = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    if (Math.abs(trend) > 15) {
      insights.push({
        id: `insight_${Date.now()}_5`,
        type: 'trend',
        message: trend > 0
          ? `Your spending increased by ${trend.toFixed(0)}% compared to last month.`
          : `Your spending decreased by ${Math.abs(trend).toFixed(0)}% compared to last month. Keep it up!`,
        severity: trend > 0 ? 'warning' : 'success',
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Insight 5: Frequent merchant detection
  const merchantCounts: Record<string, number> = {}
  thisMonthTransactions
    .filter((t) => t.merchant && t.type === 'expense')
    .forEach((t) => {
      if (t.merchant) {
        merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1
      }
    })

  const frequentMerchant = Object.entries(merchantCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])[0]

  if (frequentMerchant) {
    insights.push({
      id: `insight_${Date.now()}_6`,
      type: 'spending',
      message: `You've made ${frequentMerchant[1]} purchases at ${frequentMerchant[0]} this month. This might be a subscription or recurring expense.`,
      severity: 'info',
      createdAt: new Date().toISOString(),
    })
  }

  return insights
}

