'use client'

import { useEffect, useState } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { Plus, Edit, Trash2, Receipt, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Trash } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ReceiptScanner } from '@/components/transactions/ReceiptScanner'
import { CSVImporter } from '@/components/transactions/CSVImporter'
import { EXPENSE_CATEGORIES, getCategoryColor } from '@/utils/categories'

// Income categories
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other Income']

// Combined categories based on transaction type
const getCategoriesForType = (type: 'expense' | 'income') => {
  return type === 'income' ? INCOME_CATEGORIES : [...EXPENSE_CATEGORIES]
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const { transactions, initialize, addTransaction, updateTransaction, deleteTransaction, clearAllTransactions } =
    useFinanceStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Dining',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense' as 'expense' | 'income',
    merchant: '',
    isSubscription: false,
    subscriptionStartDate: format(new Date(), 'yyyy-MM-dd'),
    subscriptionEndDate: '',
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true)
    }
  }, [searchParams])

  const handleOpenModal = () => {
    setEditingTransaction(null)
    const today = format(new Date(), 'yyyy-MM-dd')
    setFormData({
      amount: '',
      category: 'Food & Dining',
      note: '',
      date: today,
      type: 'expense',
      merchant: '',
      isSubscription: false,
      subscriptionStartDate: today,
      subscriptionEndDate: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      category: transaction.category,
      note: transaction.note,
      date: transaction.date,
      type: transaction.type,
      merchant: transaction.merchant || '',
      isSubscription: transaction.isSubscription || false,
      subscriptionStartDate: transaction.subscriptionStartDate || transaction.date,
      subscriptionEndDate: transaction.subscriptionEndDate || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const transactionData = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      note: formData.note,
      date: formData.date,
      type: formData.type,
      merchant: formData.merchant || undefined,
      isSubscription: formData.type === 'expense' ? formData.isSubscription : undefined,
      subscriptionStartDate: formData.type === 'expense' && formData.isSubscription 
        ? formData.subscriptionStartDate 
        : undefined,
      subscriptionEndDate: formData.type === 'expense' && formData.isSubscription && formData.subscriptionEndDate
        ? formData.subscriptionEndDate
        : undefined,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData)
    } else {
      addTransaction(transactionData)
    }

    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id)
    }
  }

  const handleClearAll = () => {
    if (transactions.length === 0) return
    
    const confirmed = confirm(
      `Are you sure you want to delete ALL ${transactions.length} transactions? This action cannot be undone.`
    )
    if (confirmed) {
      clearAllTransactions()
    }
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    // First, sort by date (newest first)
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff
    
    // If same date, sort by creation time (later/newer on top)
    // Extract timestamp from ID (format: txn_<timestamp>_<random> or txn_sub_<merchant>_<index>)
    const getTimestampFromId = (id: string): number => {
      const parts = id.split('_')
      // Handle format: txn_<timestamp>_<random>
      if (parts.length >= 3 && parts[0] === 'txn' && parts[1] !== 'sub' && parts[1] !== 'income') {
        const timestamp = parseInt(parts[1])
        if (!isNaN(timestamp) && timestamp > 0) {
          return timestamp
        }
      }
      // Handle format: txn_income_<timestamp>_<index>
      if (parts.length >= 4 && parts[1] === 'income') {
        const timestamp = parseInt(parts[2])
        if (!isNaN(timestamp) && timestamp > 0) {
          return timestamp
        }
      }
      // For other formats (like txn_sub_*), use 0 as fallback (will maintain original order)
      return 0
    }
    
    const timeA = getTimestampFromId(a.id)
    const timeB = getTimestampFromId(b.id)
    
    // If both have valid timestamps, sort by timestamp (newer/later first)
    if (timeA > 0 && timeB > 0) {
      return timeB - timeA // Newer (larger timestamp) first = later transaction on top
    }
    
    // If timestamps are equal or invalid, maintain stable order (keep original position)
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">View and manage all your financial transactions</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setIsCSVImportOpen(true)} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setIsScannerOpen(true)} variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              Scan Receipt
            </Button>
            <Button onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            {transactions.length > 0 && (
              <Button 
                onClick={handleClearAll} 
                variant="outline"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50"
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Merchant</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Note</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No transactions yet. Add your first transaction to get started!
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 text-sm">{format(new Date(transaction.date), 'MMM d, yyyy')}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'income' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm capitalize">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(transaction.category) }}
                          />
                          {transaction.category}
                          {transaction.isSubscription && (
                            <>
                              {transaction.subscriptionEndDate && 
                               new Date(transaction.subscriptionEndDate) < new Date() ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-500 rounded-full border border-gray-500/20">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20">
                                  Subscription
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{transaction.merchant || '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{transaction.note}</td>
                      <td
                        className={`p-4 text-sm font-medium text-right ${
                          transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Edit transaction"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-red-500"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTransaction(null)
          }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                options={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'expense' | 'income'
                  const newCategories = getCategoriesForType(newType)
                  setFormData({ 
                    ...formData, 
                    type: newType,
                    category: newCategories[0] 
                  })
                }}
                required
              />
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <Select
              label="Category"
              options={getCategoriesForType(formData.type).map((cat) => ({ value: cat, label: cat }))}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />

            <Input
              label="Merchant (optional)"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g., Amazon, Starbucks"
            />

            <Input
              label="Note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note..."
              required
            />

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            {formData.type === 'expense' && (
              <div className="space-y-4 p-4 rounded-lg border border-border/50" style={{ backgroundColor: 'hsl(var(--muted) / 0.8)' }}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSubscription"
                    checked={formData.isSubscription}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setFormData({
                        ...formData,
                        isSubscription: isChecked,
                        subscriptionStartDate: isChecked ? formData.subscriptionStartDate : '',
                        subscriptionEndDate: isChecked ? formData.subscriptionEndDate : '',
                      })
                    }}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isSubscription" className="text-sm font-medium cursor-pointer">
                    Mark as subscription
                  </label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Helps Subscription Radar detect recurring payments
                  </span>
                </div>
                
                {formData.isSubscription && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border animate-fade-in">
                    <Input
                      label="Subscription Start Date"
                      type="date"
                      value={formData.subscriptionStartDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                      required
                    />
                    <Input
                      label="Subscription End Date (optional)"
                      type="date"
                      value={formData.subscriptionEndDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                      placeholder="Leave empty for ongoing"
                    />
                    <p className="col-span-2 text-xs text-muted-foreground">
                      Set the date range for this subscription. Leave end date empty for ongoing subscriptions.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTransaction(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Receipt Scanner Modal */}
        <ReceiptScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSave={(transaction) => {
            addTransaction(transaction)
            setIsScannerOpen(false)
          }}
        />

        {/* CSV Import Modal */}
        <CSVImporter
          isOpen={isCSVImportOpen}
          onClose={() => setIsCSVImportOpen(false)}
          onImport={(transactions) => {
            transactions.forEach(transaction => addTransaction(transaction))
          }}
        />
      </main>
    </div>
  )
}

