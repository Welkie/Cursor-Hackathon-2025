'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Transaction } from '@/types'
import {
  parseCSVString,
  getCSVHeaders,
  autoDetectColumns,
  parseCSVToTransactions,
  generateSampleCSV,
  CSVColumnMapping,
  CSVParseResult
} from '@/utils/csvParser'

interface CSVImporterProps {
  isOpen: boolean
  onClose: () => void
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete'

export function CSVImporter({ isOpen, onClose, onImport }: CSVImporterProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<CSVColumnMapping>({ amount: '', date: '' })
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvString = event.target?.result as string
        const parsedHeaders = getCSVHeaders(csvString)
        const parsedData = parseCSVString(csvString)

        setHeaders(parsedHeaders)
        setCsvData(parsedData)

        // Auto-detect column mapping
        const autoMapping = autoDetectColumns(parsedHeaders)
        setMapping(autoMapping)

        setStep('mapping')
      } catch (err) {
        alert('Failed to parse CSV file. Please check the format.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsText(file)
  }

  const handleMappingNext = () => {
    if (!mapping.amount || !mapping.date) {
      alert('Please map at least the Amount and Date columns')
      return
    }

    setIsProcessing(true)
    const result = parseCSVToTransactions(csvData, mapping)
    setParseResult(result)
    setStep('preview')
    setIsProcessing(false)
  }

  const handleImport = () => {
    if (parseResult && parseResult.transactions.length > 0) {
      onImport(parseResult.transactions)
      setStep('complete')
    }
  }

  const handleClose = () => {
    // Reset state
    setStep('upload')
    setCsvData([])
    setHeaders([])
    setMapping({ amount: '', date: '' })
    setParseResult(null)
    setFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleDownloadSample = () => {
    const sample = generateSampleCSV()
    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderUploadStep = () => (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
        onClick={() => fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Processing file...</p>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Upload CSV File</p>
            <p className="text-xs text-muted-foreground mb-3">
              Click to select or drag and drop your CSV file
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded">Auto-detect columns</span>
              <span className="px-2 py-1 bg-muted rounded">Smart categorization</span>
              <span className="px-2 py-1 bg-muted rounded">Multiple date formats</span>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Sample Download */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Need a template?</p>
            <p className="text-xs text-muted-foreground">
              Download a sample CSV to see the expected format
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </Button>
        </div>
      </div>

      {/* Supported Columns Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm font-medium mb-2">Supported Columns</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div><strong>Required:</strong> Amount, Date</div>
          <div><strong>Optional:</strong> Category, Note, Merchant, Type</div>
        </div>
      </div>
    </div>
  )

  const renderMappingStep = () => (
    <div className="space-y-4">
      {/* File Info */}
      <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">{csvData.length} rows detected</p>
        </div>
      </div>

      {/* Column Mapping */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Map your columns</p>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Amount Column *"
            options={[
              { value: '', label: 'Select column...' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.amount}
            onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
            required
          />
          <Select
            label="Date Column *"
            options={[
              { value: '', label: 'Select column...' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.date}
            onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category Column"
            options={[
              { value: '', label: 'Auto-detect' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.category || ''}
            onChange={(e) => setMapping({ ...mapping, category: e.target.value || undefined })}
          />
          <Select
            label="Note/Description Column"
            options={[
              { value: '', label: 'None' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.note || ''}
            onChange={(e) => setMapping({ ...mapping, note: e.target.value || undefined })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Merchant Column"
            options={[
              { value: '', label: 'None' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.merchant || ''}
            onChange={(e) => setMapping({ ...mapping, merchant: e.target.value || undefined })}
          />
          <Select
            label="Type Column (Income/Expense)"
            options={[
              { value: '', label: 'Auto-detect' },
              ...headers.map(h => ({ value: h, label: h }))
            ]}
            value={mapping.type || ''}
            onChange={(e) => setMapping({ ...mapping, type: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Preview first row */}
      {csvData.length > 0 && mapping.amount && mapping.date && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first row)</p>
          <div className="text-sm space-y-1">
            <p><strong>Amount:</strong> {csvData[0][mapping.amount.toLowerCase()]}</p>
            <p><strong>Date:</strong> {csvData[0][mapping.date.toLowerCase()]}</p>
            {mapping.category && <p><strong>Category:</strong> {csvData[0][mapping.category.toLowerCase()]}</p>}
            {mapping.note && <p><strong>Note:</strong> {csvData[0][mapping.note.toLowerCase()]}</p>}
          </div>
        </div>
      )}
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-500">{parseResult?.transactions.length || 0}</p>
          <p className="text-xs text-muted-foreground">Ready to import</p>
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-500">{parseResult?.skipped || 0}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold">{parseResult?.total || 0}</p>
          <p className="text-xs text-muted-foreground">Total rows</p>
        </div>
      </div>

      {/* Errors */}
      {parseResult?.errors && parseResult.errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-red-500">Parsing Errors</p>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {parseResult.errors.map((error, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Preview */}
      {parseResult?.transactions && parseResult.transactions.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2 text-xs font-medium">Date</th>
                  <th className="text-left p-2 text-xs font-medium">Category</th>
                  <th className="text-left p-2 text-xs font-medium">Note</th>
                  <th className="text-right p-2 text-xs font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.transactions.slice(0, 10).map((txn, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="p-2 text-xs">{txn.date}</td>
                    <td className="p-2 text-xs">{txn.category}</td>
                    <td className="p-2 text-xs truncate max-w-[150px]">{txn.note}</td>
                    <td className={`p-2 text-xs text-right font-medium ${txn.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parseResult.transactions.length > 10 && (
            <div className="p-2 bg-muted text-center text-xs text-muted-foreground">
              +{parseResult.transactions.length - 10} more transactions
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Successfully imported {parseResult?.transactions.length || 0} transactions
      </p>
      <Button onClick={handleClose}>Done</Button>
    </div>
  )

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Import from CSV'
      case 'mapping': return 'Map Columns'
      case 'preview': return 'Preview Import'
      case 'complete': return 'Import Complete'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getStepTitle()} size="lg">
      <div className="space-y-4">
        {/* Progress Steps */}
        {step !== 'complete' && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {['upload', 'mapping', 'preview'].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-primary text-primary-foreground' : 
                  ['upload', 'mapping', 'preview'].indexOf(step) > idx ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {['upload', 'mapping', 'preview'].indexOf(step) > idx ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                {idx < 2 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'complete' && renderCompleteStep()}

        {/* Actions */}
        {step !== 'complete' && (
          <div className="flex gap-3 pt-4">
            {step === 'mapping' && (
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
            )}
            {step === 'preview' && (
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
            )}
            
            <div className="flex-1" />
            
            {step === 'mapping' && (
              <Button onClick={handleMappingNext} disabled={!mapping.amount || !mapping.date}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === 'preview' && parseResult && parseResult.transactions.length > 0 && (
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import {parseResult.transactions.length} Transactions
              </Button>
            )}
            
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

