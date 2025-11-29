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
import { Plus, Edit, Trash2, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ReceiptScanner } from '@/components/transactions/ReceiptScanner'

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Other',
]

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const { transactions, initialize, addTransaction, updateTransaction, deleteTransaction } =
    useFinanceStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense' as 'expense' | 'income',
    merchant: '',
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
    setFormData({
      amount: '',
      category: 'Food',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      merchant: '',
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

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">View and manage all your financial transactions</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsScannerOpen(true)} variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              Scan Receipt
            </Button>
            <Button onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
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
                      <td className="p-4 text-sm">{transaction.category}</td>
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'expense' | 'income' })}
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
              options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
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
      </main>
    </div>
  )
}

