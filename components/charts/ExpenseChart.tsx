'use client'

import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Transaction } from '@/types'
import { format, subDays, startOfDay } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ExpenseChartProps {
  transactions: Transaction[]
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    // Get last 30 days
    const days = 30
    const labels: string[] = []
    const expenseData: number[] = []
    const incomeData: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      const dateStr = format(date, 'MMM dd')
      labels.push(dateStr)

      const dayTransactions = transactions.filter((t) => {
        const tDate = startOfDay(new Date(t.date))
        return tDate.getTime() === date.getTime()
      })

      const expenses = dayTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      const income = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      expenseData.push(expenses)
      incomeData.push(income)
    }

    return {
      labels,
      datasets: [
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }, [transactions])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '$' + value
          },
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  )
}

