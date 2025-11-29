'use client'

import { useMemo, useState } from 'react'
import { Transaction } from '@/types'
import { forecastEndOfMonthBalance, ForecastResult } from '@/utils/forecasting'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format, endOfMonth } from 'date-fns'

interface ForecastCardProps {
  transactions: Transaction[]
}

export function ForecastCard({ transactions }: ForecastCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const forecast = useMemo(() => {
    return forecastEndOfMonthBalance(transactions)
  }, [transactions])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh animation
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      default: return 'text-orange-500 bg-orange-500/10'
    }
  }

  const getBalanceStatus = () => {
    if (forecast.projectedEOMBalance < 0) {
      return { icon: AlertTriangle, color: 'text-red-500', label: 'Warning' }
    }
    if (forecast.projectedEOMBalance < forecast.currentBalance * 0.3) {
      return { icon: TrendingDown, color: 'text-yellow-500', label: 'Declining' }
    }
    return { icon: CheckCircle, color: 'text-green-500', label: 'Healthy' }
  }

  const status = getBalanceStatus()
  const StatusIcon = status.icon
  const eomDate = format(endOfMonth(new Date()), 'MMM d, yyyy')

  return (
    <div className="space-y-4">
      {/* Main Forecast Display */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">EOM Balance Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(forecast.confidence)}`}>
              {forecast.confidence} confidence
            </span>
            <button 
              onClick={handleRefresh}
              className="p-1 hover:bg-primary/10 rounded transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              ${forecast.projectedEOMBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Projected for {eomDate}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${status.color}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Daily Avg</p>
            <p className="text-sm font-semibold">${forecast.averageDailySpending.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Days Left</p>
            <p className="text-sm font-semibold">{forecast.remainingDays}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Proj. Spending</p>
            <p className="text-sm font-semibold">${forecast.projectedExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Details */}
      <Button 
        variant="ghost" 
        className="w-full justify-between text-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>View Details</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          {/* Breakdown */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Projection Breakdown</p>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-medium">${forecast.currentBalance.toFixed(2)}</span>
            </div>
            
            {forecast.projectedIncome > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>+ Expected Income</span>
                <span className="font-medium">+${forecast.projectedIncome.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-red-500">
              <span>- Variable Spending</span>
              <span className="font-medium">-${forecast.projectedVariableSpending.toFixed(2)}</span>
            </div>
            
            {forecast.recurringExpenses.length > 0 && (
              <div className="flex justify-between text-sm text-orange-500">
                <span>- Recurring ({forecast.recurringExpenses.length})</span>
                <span className="font-medium">
                  -${forecast.recurringExpenses.reduce((s, r) => s + r.averageAmount, 0).toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
              <span>= Projected EOM</span>
              <span className={forecast.projectedEOMBalance < 0 ? 'text-red-500' : 'text-green-500'}>
                ${forecast.projectedEOMBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Recurring Expenses */}
          {forecast.recurringExpenses.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Detected Recurring Expenses
              </p>
              <div className="space-y-1">
                {forecast.recurringExpenses.slice(0, 5).map((recurring, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="truncate flex-1 mr-2">
                      {recurring.merchant || recurring.category}
                    </span>
                    <span className="text-muted-foreground">
                      ${recurring.averageAmount.toFixed(2)}/{recurring.frequency === 'monthly' ? 'mo' : recurring.frequency === 'weekly' ? 'wk' : '2wk'}
                    </span>
                  </div>
                ))}
                {forecast.recurringExpenses.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{forecast.recurringExpenses.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">AI Insights</p>
            <div className="space-y-1">
              {forecast.insights.map((insight, idx) => (
                <p key={idx} className="text-sm">{insight}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

