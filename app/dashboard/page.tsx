'use client'

import { useEffect } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { TrendingUp, TrendingDown, DollarSign, Target, Brain, Receipt } from 'lucide-react'
import { ExpenseChart } from '@/components/charts/ExpenseChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { generateInsights } from '@/utils/insights'
import { detectSubscriptions } from '@/utils/subscriptionDetection'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const {
    transactions,
    goals,
    insights,
    initialize,
    loadFromStorage,
    setSubscriptions,
    addInsight,
  } = useFinanceStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (transactions.length > 0) {
      // Generate insights
      const newInsights = generateInsights(transactions)
      newInsights.forEach((insight) => addInsight(insight))

      // Detect subscriptions
      const detectedSubscriptions = detectSubscriptions(transactions)
      setSubscriptions(detectedSubscriptions)
    }
  }, [transactions, addInsight, setSubscriptions])

  // Calculate summary stats
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subDays(now, 30))
  const lastMonthEnd = endOfMonth(subDays(now, 30))

  const thisMonthTransactions = transactions.filter(
    (t) => new Date(t.date) >= thisMonthStart && new Date(t.date) <= thisMonthEnd
  )
  const lastMonthTransactions = transactions.filter(
    (t) => new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd
  )

  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const thisMonthIncome = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenseChange = lastMonthExpenses > 0 
    ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0

  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalGoalTargets = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  const recentInsights = insights.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Month Expenses</p>
                <p className="text-2xl font-bold">${thisMonthExpenses.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {expenseChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm ${expenseChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(expenseChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Month Income</p>
                <p className="text-2xl font-bold">${thisMonthIncome.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Net: ${(thisMonthIncome - thisMonthExpenses).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Savings</p>
                <p className="text-2xl font-bold">${totalSavings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {goals.length} active goal{goals.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {recentInsights.length} new this week
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Brain className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts and Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Spending Trend" description="Last 30 days" />
              <ExpenseChart transactions={transactions} />
            </Card>
          </div>

          {/* AI Insights Panel */}
          <Card>
            <CardHeader 
              title="AI Spending Mind" 
              description="Smart insights about your finances"
              action={
                <Link href="/transactions">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              }
            />
            <InsightsPanel insights={recentInsights} />
          </Card>
        </div>

        {/* Category Chart and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Spending by Category" description="This month breakdown" />
            <CategoryChart transactions={thisMonthTransactions} />
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <div className="space-y-3">
              <Link href="/transactions?action=add">
                <Button className="w-full justify-start" variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </Link>
              <Link href="/goals?action=add">
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </Link>
              <Link href="/subscriptions">
                <Button className="w-full justify-start" variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  View Subscriptions
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

