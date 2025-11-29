import { Transaction, Goal, Subscription, Insight } from '@/types'

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions',
  GOALS: 'finance_goals',
  SUBSCRIPTIONS: 'finance_subscriptions',
  INSIGHTS: 'finance_insights',
  DARK_MODE: 'darkMode',
} as const

export const storage = {
  // Transactions
  getTransactions: (): Transaction[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error parsing transactions from localStorage:', error)
      return []
    }
  },

  saveTransactions: (transactions: Transaction[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error)
    }
  },

  // Goals
  getGoals: (): Goal[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error parsing goals from localStorage:', error)
      return []
    }
  },

  saveGoals: (goals: Goal[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals))
    } catch (error) {
      console.error('Error saving goals to localStorage:', error)
    }
  },

  // Subscriptions
  getSubscriptions: (): Subscription[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error parsing subscriptions from localStorage:', error)
      return []
    }
  },

  saveSubscriptions: (subscriptions: Subscription[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions))
    } catch (error) {
      console.error('Error saving subscriptions to localStorage:', error)
    }
  },

  // Insights
  getInsights: (): Insight[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSIGHTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error parsing insights from localStorage:', error)
      return []
    }
  },

  saveInsights: (insights: Insight[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights))
    } catch (error) {
      console.error('Error saving insights to localStorage:', error)
    }
  },
}

