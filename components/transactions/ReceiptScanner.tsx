'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Upload, X, Check } from 'lucide-react'
import { Transaction } from '@/types'
import { format } from 'date-fns'

interface ReceiptScannerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Omit<Transaction, 'id'>) => void
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
]

export function ReceiptScanner({ isOpen, onClose, onSave }: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState({
    amount: '',
    category: 'Food',
    merchant: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        // Simulate OCR processing
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
          // Pre-fill some mock data to simulate OCR
          setExtractedData({
            ...extractedData,
            amount: (Math.random() * 100 + 10).toFixed(2),
            merchant: ['Starbucks', 'Target', 'Walmart', 'Amazon'][Math.floor(Math.random() * 4)],
          })
        }, 1500)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!extractedData.amount || !extractedData.note) {
      alert('Please fill in all required fields')
      return
    }

    onSave({
      amount: parseFloat(extractedData.amount),
      category: extractedData.category,
      note: extractedData.note,
      date: extractedData.date,
      type: 'expense',
      merchant: extractedData.merchant || undefined,
    })

    // Reset
    setImagePreview(null)
    setExtractedData({
      amount: '',
      category: 'Food',
      merchant: '',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt Scanner" size="lg">
      <div className="space-y-6">
        {/* Upload Area */}
        {!imagePreview ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Upload Receipt Image</p>
            <p className="text-xs text-muted-foreground">Click to select or drag and drop</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Receipt" className="w-full h-64 object-contain bg-muted" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-card rounded-lg p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-foreground">Processing OCR...</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-card rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Extracted Data Form */}
        {imagePreview && !isProcessing && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-medium">OCR Results (Please verify and edit)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Review the extracted information below and make any necessary corrections.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={extractedData.amount}
                onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                required
              />
              <Select
                label="Category"
                options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                value={extractedData.category}
                onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                required
              />
            </div>

            <Input
              label="Merchant"
              value={extractedData.merchant}
              onChange={(e) => setExtractedData({ ...extractedData, merchant: e.target.value })}
              placeholder="Store or merchant name"
            />

            <Input
              label="Note"
              value={extractedData.note}
              onChange={(e) => setExtractedData({ ...extractedData, note: e.target.value })}
              placeholder="Add a note about this purchase"
              required
            />

            <Input
              label="Date"
              type="date"
              value={extractedData.date}
              onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!imagePreview || isProcessing || !extractedData.amount || !extractedData.note}
            className="flex-1"
          >
            Save Transaction
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

