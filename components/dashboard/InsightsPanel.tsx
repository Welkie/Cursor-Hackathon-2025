'use client'

import { Insight } from '@/types'
import { Brain, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { format } from 'date-fns'

interface InsightsPanelProps {
  insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No insights yet. Add some transactions to get started!</p>
      </div>
    )
  }

  const getIcon = (severity: Insight['severity']) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = (severity: Insight['severity']) => {
    switch (severity) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/20'
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const sortedInsights = [...insights].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-3">
      {sortedInsights.map((insight) => (
        <div
          key={insight.id}
          className={`p-4 rounded-lg border ${getBgColor(insight.severity)} animate-fade-in`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(insight.severity)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{insight.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(insight.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

