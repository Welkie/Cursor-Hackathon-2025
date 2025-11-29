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
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    return data ? JSON.parse(data) : []
  },

  saveTransactions: (transactions: Transaction[]): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
  },

  // Goals
  getGoals: (): Goal[] => {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.GOALS)
    return data ? JSON.parse(data) : []
  },

  saveGoals: (goals: Goal[]): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals))
  },

  // Subscriptions
  getSubscriptions: (): Subscription[] => {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)
    return data ? JSON.parse(data) : []
  },

  saveSubscriptions: (subscriptions: Subscription[]): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions))
  },

  // Insights
  getInsights: (): Insight[] => {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.INSIGHTS)
    return data ? JSON.parse(data) : []
  },

  saveInsights: (insights: Insight[]): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights))
  },
}

