'use client'

import { useEffect, useState } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Goal } from '@/types'
import { format } from 'date-fns'
import { Plus, Target, TrendingUp, Calendar, DollarSign, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function GoalsPage() {
  const searchParams = useSearchParams()
  const { goals, initialize, addGoal, updateGoal, deleteGoal, addToGoal, toggleGoalCompletion } = useFinanceStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddAmountModalOpen, setIsAddAmountModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
  })
  const [addAmount, setAddAmount] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true)
    }
  }, [searchParams])

  const handleOpenModal = () => {
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (goal: Goal) => {
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || '',
    })
    setSelectedGoal(goal)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const goalData = {
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      targetDate: formData.targetDate || undefined,
    }

    if (selectedGoal) {
      updateGoal(selectedGoal.id, goalData)
    } else {
      addGoal(goalData)
    }

    setIsModalOpen(false)
    setSelectedGoal(null)
  }

  const handleAddAmount = (goal: Goal) => {
    setSelectedGoal(goal)
    setAddAmount('')
    setIsAddAmountModalOpen(true)
  }

  const handleSaveAmount = () => {
    if (selectedGoal && addAmount) {
      addToGoal(selectedGoal.id, parseFloat(addAmount))
      setIsAddAmountModalOpen(false)
      setSelectedGoal(null)
      setAddAmount('')
    }
  }

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  }

  const calculateWeeklySavings = (goal: Goal) => {
    if (!goal.targetDate || goal.completed) return null
    const targetDate = new Date(goal.targetDate)
    const now = new Date()
    const weeksRemaining = Math.max(
      Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)),
      1
    )
    const remaining = goal.targetAmount - goal.currentAmount
    return remaining > 0 ? remaining / weeksRemaining : 0
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id)
    }
  }

  const handleToggleCompletion = (goal: Goal) => {
    toggleGoalCompletion(goal.id)
  }

  const incompleteGoals = [...goals].filter((g) => !g.completed).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const completedGoals = [...goals].filter((g) => g.completed).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Goals</h1>
            <p className="text-muted-foreground">Set and track your savings goals</p>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <Card className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-6">Create your first financial goal to get started!</p>
            <Button onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </Card>
        ) : (
          <>
            {/* Incomplete Goals */}
            {incompleteGoals.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {incompleteGoals.map((goal) => {
                    const progress = calculateProgress(goal)
                    const weeklySavings = calculateWeeklySavings(goal)

                    return (
                      <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader
                          title={goal.title}
                          action={
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddAmount(goal)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                aria-label="Add amount"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(goal)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                aria-label="Edit goal"
                              >
                                <Target className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(goal.id)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-red-500"
                                aria-label="Delete goal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          }
                        />

                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current</span>
                        <span className="text-lg font-bold">${goal.currentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target</span>
                        <span className="text-sm font-medium">${goal.targetAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="text-sm font-semibold text-primary">
                          ${(goal.targetAmount - goal.currentAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Weekly Savings Suggestion */}
                    {weeklySavings !== null && weeklySavings > 0 && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium">Suggested Weekly Savings</span>
                        </div>
                        <p className="text-lg font-bold text-blue-500">${weeklySavings.toFixed(2)}</p>
                      </div>
                    )}

                    {/* Target Date */}
                    {goal.targetDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 space-y-2">
                      <Button
                        onClick={() => handleAddAmount(goal)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Add Money
                      </Button>
                      <Button
                        onClick={() => handleToggleCompletion(goal)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </Card>
                  )
                })}
              </div>
            </div>
          )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Completed Goals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedGoals.map((goal) => {
                    const progress = calculateProgress(goal)

                    return (
                      <Card
                        key={goal.id}
                        className="hover:shadow-lg transition-shadow opacity-75 border-green-500/30 bg-green-500/5"
                      >
                        <CardHeader
                          title={
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span>{goal.title}</span>
                            </div>
                          }
                          action={
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleCompletion(goal)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                aria-label="Mark incomplete"
                              >
                                <Circle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(goal.id)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-red-500"
                                aria-label="Delete goal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          }
                        />

                        <div className="space-y-4">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Progress</span>
                              <span className="text-sm font-medium text-green-500">
                                {progress.toFixed(0)}% ✓
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Amounts */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Current</span>
                              <span className="text-lg font-bold text-green-500">
                                ${goal.currentAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Target</span>
                              <span className="text-sm font-medium">${goal.targetAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Completed Date */}
                          {goal.completedAt && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-medium text-green-500">Completed</span>
                              </div>
                              <p className="text-sm text-foreground mt-1">
                                {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Goal Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedGoal(null)
          }}
          title={selectedGoal ? 'Edit Goal' : 'Create Goal'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Goal Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Save for Laptop"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
              />
              <Input
                label="Current Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                required
              />
            </div>

            <Input
              label="Target Date (optional)"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {selectedGoal ? 'Update' : 'Create'} Goal
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedGoal(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Amount Modal */}
        <Modal
          isOpen={isAddAmountModalOpen}
          onClose={() => {
            setIsAddAmountModalOpen(false)
            setSelectedGoal(null)
          }}
          title="Add Money to Goal"
        >
          <div className="space-y-4">
            {selectedGoal && (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Goal</p>
                  <p className="font-semibold">{selectedGoal.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-medium">${selectedGoal.currentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="font-medium">${selectedGoal.targetAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Input
                  label="Amount to Add"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveAmount} className="flex-1" disabled={!addAmount}>
                    Add Amount
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddAmountModalOpen(false)
                      setSelectedGoal(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </main>
    </div>
  )
}

