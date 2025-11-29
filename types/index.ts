export interface Transaction {
  id: string
  amount: number
  category: string
  note: string
  date: string
  type: 'expense' | 'income'
  merchant?: string
  isSubscription?: boolean
  subscriptionStartDate?: string
  subscriptionEndDate?: string
}

export interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  createdAt: string
  completed: boolean
  completedAt?: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  category: string
  frequency: 'monthly' | 'yearly'
  nextBillingDate: string
  detectedFrom: string[]
}

export interface Insight {
  id: string
  type: 'spending' | 'category' | 'budget' | 'trend'
  message: string
  severity: 'info' | 'warning' | 'success'
  createdAt: string
}

