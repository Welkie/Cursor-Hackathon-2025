import { Transaction, Goal } from '@/types'
import { format, subDays, subMonths } from 'date-fns'

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education']
const merchants = ['Starbucks', 'Amazon', 'Uber', 'Netflix', 'Spotify', 'Apple', 'Target', 'Walmart', 'McDonald\'s', 'Shell']

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(daysAgo: number): string {
  return format(subDays(new Date(), Math.floor(Math.random() * daysAgo)), 'yyyy-MM-dd')
}

export function generateMockTransactions(): Transaction[] {
  const transactions: Transaction[] = []
  
  // Generate transactions for the last 60 days
  for (let i = 0; i < 30; i++) {
    const amount = Math.floor(Math.random() * 200) + 5
    const category = randomItem(categories)
    const merchant = randomItem(merchants)
    const transactionDate = randomDate(60)
    // Generate unique timestamp for each transaction to ensure proper sorting
    const baseTime = new Date(transactionDate).getTime()
    const timeOffset = i * 1000 // Add 1 second per transaction to ensure unique timestamps
    
    transactions.push({
      id: `txn_${baseTime + timeOffset}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      category,
      note: `${merchant} purchase`,
      date: transactionDate,
      type: 'expense',
      merchant,
    })
  }

  // Add some subscription transactions (Netflix, Spotify, etc.)
  const subscriptionMerchants = ['Netflix', 'Spotify', 'Apple']
  const subscriptionAmounts = [15.99, 9.99, 4.99]
  
  subscriptionMerchants.forEach((merchant, index) => {
    // Add 2-3 transactions per subscription to simulate monthly pattern
    const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    for (let i = 0; i < 3; i++) {
      const daysAgo = 30 * (i + 1) // 30, 60, 90 days ago
      const transactionDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
      const baseTime = new Date(transactionDate).getTime()
      // Generate unique timestamp for subscription transactions
      const uniqueTimestamp = baseTime + (index * 10000) + (i * 1000)
      
      transactions.push({
        id: `txn_${uniqueTimestamp}_${Math.random().toString(36).substr(2, 9)}`,
        amount: subscriptionAmounts[index],
        category: 'Entertainment',
        note: `${merchant} subscription`,
        date: transactionDate,
        type: 'expense',
        merchant,
        isSubscription: true,
        subscriptionStartDate: startDate,
        subscriptionEndDate: undefined,
      })
    }
  })

  // Add some income
  for (let i = 0; i < 3; i++) {
    const transactionDate = randomDate(30)
    const baseTime = new Date(transactionDate).getTime()
    const uniqueTimestamp = baseTime + (i * 2000) // Add 2 seconds per income transaction
    
    transactions.push({
      id: `txn_${uniqueTimestamp}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.floor(Math.random() * 2000) + 1000,
      category: 'Salary',
      note: 'Monthly salary',
      date: transactionDate,
      type: 'income',
    })
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateMockGoals(): Goal[] {
  return [
    {
      id: 'goal_1',
      title: 'Save for Laptop',
      targetAmount: 1500,
      currentAmount: 450,
      targetDate: format(subMonths(new Date(), -3), 'yyyy-MM-dd'),
      createdAt: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      completed: false,
    },
    {
      id: 'goal_2',
      title: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 1200,
      createdAt: format(subMonths(new Date(), 2), 'yyyy-MM-dd'),
      completed: false,
    },
  ]
}

