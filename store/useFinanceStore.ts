import { create } from 'zustand'
import { Transaction, Goal, Subscription, Insight } from '@/types'
import { storage } from '@/utils/localStorage'
import { generateMockTransactions, generateMockGoals } from '@/utils/mockData'

interface FinanceState {
  transactions: Transaction[]
  goals: Goal[]
  subscriptions: Subscription[]
  insights: Insight[]
  darkMode: boolean
  initialized: boolean
  
  // Actions
  initialize: () => void
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addToGoal: (id: string, amount: number) => void
  setSubscriptions: (subscriptions: Subscription[]) => void
  addInsight: (insight: Omit<Insight, 'id' | 'createdAt'>) => void
  clearInsights: () => void
  toggleDarkMode: () => void
  loadFromStorage: () => void
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  goals: [],
  subscriptions: [],
  insights: [],
  darkMode: false,
  initialized: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return
    
    const transactions = storage.getTransactions()
    const goals = storage.getGoals()
    const subscriptions = storage.getSubscriptions()
    const insights = storage.getInsights()
    const darkMode = localStorage.getItem('darkMode') === 'true'
    
    set({
      transactions,
      goals,
      subscriptions,
      insights,
      darkMode,
    })
  },

  initialize: () => {
    if (get().initialized) return
    
    get().loadFromStorage()
    
    const transactions = get().transactions
    const goals = get().goals
    
    // Generate mock data if storage is empty
    if (transactions.length === 0) {
      const mockTransactions = generateMockTransactions()
      storage.saveTransactions(mockTransactions)
      set({ transactions: mockTransactions })
    }

    if (goals.length === 0) {
      const mockGoals = generateMockGoals()
      storage.saveGoals(mockGoals)
      set({ goals: mockGoals })
    }

    set({ initialized: true })
  },

  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random()}`,
    }
    const transactions = [...get().transactions, newTransaction]
    storage.saveTransactions(transactions)
    set({ transactions })
  },

  updateTransaction: (id, updates) => {
    const transactions = get().transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    )
    storage.saveTransactions(transactions)
    set({ transactions })
  },

  deleteTransaction: (id) => {
    const transactions = get().transactions.filter((t) => t.id !== id)
    storage.saveTransactions(transactions)
    set({ transactions })
  },

  addGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    }
    const goals = [...get().goals, newGoal]
    storage.saveGoals(goals)
    set({ goals })
  },

  updateGoal: (id, updates) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    )
    storage.saveGoals(goals)
    set({ goals })
  },

  deleteGoal: (id) => {
    const goals = get().goals.filter((g) => g.id !== id)
    storage.saveGoals(goals)
    set({ goals })
  },

  addToGoal: (id, amount) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
    )
    storage.saveGoals(goals)
    set({ goals })
  },

  setSubscriptions: (subscriptions) => {
    storage.saveSubscriptions(subscriptions)
    set({ subscriptions })
  },

  addInsight: (insight) => {
    const newInsight: Insight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    }
    const insights = [newInsight, ...get().insights].slice(0, 10) // Keep last 10
    storage.saveInsights(insights)
    set({ insights })
  },

  clearInsights: () => {
    set({ insights: [] })
    storage.saveInsights([])
  },

  toggleDarkMode: () => {
    const darkMode = !get().darkMode
    set({ darkMode })
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(darkMode))
      document.documentElement.classList.toggle('dark', darkMode)
    }
  },
}))

