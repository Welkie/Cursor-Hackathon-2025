'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Upload, X, Check, Sparkles, AlertCircle, Zap } from 'lucide-react'
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { EXPENSE_CATEGORIES, getCategoryColor } from '@/utils/categories'

interface ReceiptScannerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Omit<Transaction, 'id'>) => void
}

interface ExtractedItem {
  name: string
  price: number
}

interface OCRResponse {
  success: boolean
  data?: {
    merchant: string
    amount: number
    originalCurrency?: string
    originalAmount?: number
    date: string
    category: string
    items: ExtractedItem[]
    confidence: number
    rawText: string
  }
  error?: string
}

export function ReceiptScanner({ isOpen, onClose, onSave }: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState({
    amount: '',
    category: 'Food & Dining',
    merchant: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [originalCurrency, setOriginalCurrency] = useState<string | null>(null)
  const [originalAmount, setOriginalAmount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setConfidence(null)
    setExtractedItems([])
    setRawText('')
    setOriginalCurrency(null)
    setOriginalAmount(null)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setImagePreview(base64Image)
      
      // Process with Gemini OCR
      setIsProcessing(true)
      
      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Image }),
        })

        const result: OCRResponse = await response.json()

        if (result.success && result.data) {
          setExtractedData({
            amount: result.data.amount.toFixed(2),
            category: result.data.category,
            merchant: result.data.merchant,
            note: result.data.items.length > 0 
              ? result.data.items.map(item => item.name).join(', ')
              : '',
            date: result.data.date,
          })
          setExtractedItems(result.data.items)
          setConfidence(result.data.confidence)
          setRawText(result.data.rawText)
          setOriginalCurrency(result.data.originalCurrency || null)
          setOriginalAmount(result.data.originalAmount || null)
        } else {
          setError(result.error || 'Failed to process receipt')
          // Reset to defaults on error instead of preserving previous state
          setExtractedData({
            amount: '',
            category: 'Food & Dining',
            merchant: '',
            note: '',
            date: format(new Date(), 'yyyy-MM-dd'),
          })
        }
      } catch (err) {
        console.error('OCR Error:', err)
        setError('Failed to connect to OCR service. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!extractedData.amount) {
      alert('Please fill in the amount')
      return
    }

    onSave({
      amount: parseFloat(extractedData.amount),
      category: extractedData.category,
      note: extractedData.note || extractedData.merchant || 'Receipt scan',
      date: extractedData.date,
      type: 'expense',
      merchant: extractedData.merchant || undefined,
    })

    // Reset
    handleReset()
  }

  const handleReset = () => {
    setImagePreview(null)
    setExtractedData({
      amount: '',
      category: 'Food & Dining',
      merchant: '',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    })
    setExtractedItems([])
    setConfidence(null)
    setError(null)
    setRawText('')
    setOriginalCurrency(null)
    setOriginalAmount(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    handleReset()
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-500'
    if (conf >= 0.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Receipt Scanner" size="lg">
      <div className="space-y-4">
        {/* AI Badge */}
        <div className="flex items-center gap-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Powered by Gemini AI Vision</span>
        </div>

        {/* Upload Area */}
        {!imagePreview ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="relative inline-block">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Zap className="h-5 w-5 absolute -top-1 -right-1 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium mb-1">Upload Receipt Image</p>
            <p className="text-xs text-muted-foreground mb-3">Click to select or drag and drop</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded">Auto-extract amount</span>
              <span className="px-2 py-1 bg-muted rounded">Smart categorization</span>
              <span className="px-2 py-1 bg-muted rounded">Item detection</span>
            </div>
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
              <img src={imagePreview} alt="Receipt" className="w-full h-48 object-contain bg-muted" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-card rounded-lg p-6 text-center shadow-xl">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto mb-3"></div>
                      <Sparkles className="h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Analyzing with AI...</p>
                    <p className="text-xs text-muted-foreground mt-1">Extracting receipt details</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-card rounded-lg border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can still manually enter the receipt details below.
            </p>
          </div>
        )}

        {/* Extracted Data Form */}
        {imagePreview && !isProcessing && (
          <div className="space-y-3 animate-fade-in">
            {/* Success Banner */}
            {confidence !== null && !error && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">AI Extraction Complete</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(confidence)}`}>
                    <Sparkles className="h-3 w-3" />
                    <span>{Math.round(confidence * 100)}%</span>
                  </div>
                </div>
                {originalCurrency && originalCurrency !== 'USD' && originalAmount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Converted from {originalAmount.toLocaleString()} {originalCurrency} → ${parseFloat(extractedData.amount).toFixed(2)} USD
                  </p>
                )}
              </div>
            )}

            {/* Extracted Items */}
            {extractedItems.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Detected Items ({extractedItems.length})</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {extractedItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-primary font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {extractedItems.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{extractedItems.length - 5} more items</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={extractedData.amount}
                onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="relative">
                  <Select
                    options={EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    required
                  />
                  <div 
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(extractedData.category) }}
                  />
                </div>
              </div>
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
            />

            <Input
              label="Date"
              type="date"
              value={extractedData.date}
              onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
              required
            />

            {/* Raw Text Toggle */}
            {rawText && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  View extracted text
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded-lg overflow-auto whitespace-pre-wrap text-muted-foreground max-h-24 text-[10px]">
                  {rawText}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!imagePreview || isProcessing || !extractedData.amount}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
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
