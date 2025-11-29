'use client'

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Transaction } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryChartProps {
  transactions: Transaction[]
}

const COLORS = [
  'rgba(59, 130, 246, 0.8)',   // blue
  'rgba(239, 68, 68, 0.8)',    // red
  'rgba(34, 197, 94, 0.8)',     // green
  'rgba(251, 146, 60, 0.8)',    // orange
  'rgba(168, 85, 247, 0.8)',    // purple
  'rgba(236, 72, 153, 0.8)',    // pink
  'rgba(14, 165, 233, 0.8)',    // sky
  'rgba(234, 179, 8, 0.8)',     // yellow
]

export function CategoryChart({ transactions }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      })

    const categories = Object.keys(categoryTotals)
    const amounts = categories.map((cat) => categoryTotals[cat])

    return {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: COLORS.slice(0, categories.length),
          borderWidth: 2,
          borderColor: 'hsl(var(--background))',
        },
      ],
    }
  }, [transactions])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: $${value.toFixed(2)} (${percentage}%)`
          },
        },
      },
    },
  }

  if (chartData.labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No expense data available
      </div>
    )
  }

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

