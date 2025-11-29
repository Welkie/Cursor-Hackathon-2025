'use client'

import { useEffect } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Subscription } from '@/types'
import { format } from 'date-fns'
import { Radar, Calendar, DollarSign, RefreshCw } from 'lucide-react'
import { detectSubscriptions } from '@/utils/subscriptionDetection'

export default function SubscriptionsPage() {
  const { transactions, subscriptions, initialize, setSubscriptions } = useFinanceStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (transactions.length > 0) {
      const detected = detectSubscriptions(transactions)
      setSubscriptions(detected)
    }
  }, [transactions, setSubscriptions])

  const handleRefresh = () => {
    const detected = detectSubscriptions(transactions)
    setSubscriptions(detected)
  }

  const getNextBillingDays = (date: string) => {
    const nextDate = new Date(date)
    const now = new Date()
    const diffTime = nextDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalMonthly = subscriptions
    .filter((s) => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0)

  const totalYearly = subscriptions
    .filter((s) => s.frequency === 'yearly')
    .reduce((sum, s) => sum + s.amount / 12, 0)

  const totalMonthlyEquivalent = totalMonthly + totalYearly

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Subscription Radar</h1>
            <p className="text-muted-foreground">
              Automatically detected recurring subscriptions from your transactions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Refresh subscriptions"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Radar className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold">${totalMonthlyEquivalent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">per month</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Yearly Cost</p>
                <p className="text-2xl font-bold">${(totalMonthlyEquivalent * 12).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">per year</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <Card className="text-center py-12">
            <Radar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No subscriptions detected</h3>
            <p className="text-muted-foreground mb-4">
              Add more transactions with recurring patterns to detect subscriptions automatically.
            </p>
            <p className="text-sm text-muted-foreground">
              Subscriptions are detected based on repeated merchant/category patterns with similar amounts.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => {
              const daysUntil = getNextBillingDays(subscription.nextBillingDate)
              const isUpcoming = daysUntil <= 7

              return (
                <Card
                  key={subscription.id}
                  className={`hover:shadow-lg transition-shadow ${
                    isUpcoming ? 'border-orange-500/50 bg-orange-500/5' : ''
                  }`}
                >
                  <CardHeader
                    title={subscription.name}
                    description={subscription.category}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="text-xl font-bold">${subscription.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Frequency</span>
                      <span className="text-sm font-medium capitalize">{subscription.frequency}</span>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Next Billing</span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')}
                      </p>
                      {isUpcoming && (
                        <p className="text-xs text-orange-500 mt-1 font-medium">
                          In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Detected from {subscription.detectedFrom.length} transaction
                        {subscription.detectedFrom.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

