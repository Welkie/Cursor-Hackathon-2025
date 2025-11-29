import { Transaction } from '@/types'
import { format, parse, isValid } from 'date-fns'

export interface CSVParseResult {
  success: boolean
  transactions: Omit<Transaction, 'id'>[]
  errors: string[]
  skipped: number
  total: number
}

export interface CSVColumnMapping {
  amount: string
  date: string
  category?: string
  note?: string
  type?: string
  merchant?: string
}

// Common date formats to try parsing
const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'M/d/yyyy',
  'd/M/yyyy',
  'yyyy/MM/dd',
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'd MMM yyyy',
]

// Default category mapping based on common keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast'],
  'Groceries': ['grocery', 'supermarket', 'market', 'whole foods', 'trader joe', 'costco', 'walmart'],
  'Coffee & Cafe': ['coffee', 'cafe', 'starbucks', 'dunkin', 'tea'],
  'Fast Food': ['mcdonald', 'burger', 'kfc', 'taco bell', 'wendy', 'pizza', 'subway'],
  'Transport': ['transport', 'transit', 'bus', 'train', 'metro'],
  'Gas & Fuel': ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp', 'petrol'],
  'Rideshare': ['uber', 'lyft', 'grab', 'taxi', 'cab'],
  'Shopping': ['shopping', 'retail', 'store', 'amazon', 'target', 'purchase'],
  'Clothing': ['clothing', 'clothes', 'apparel', 'fashion', 'nike', 'adidas', 'h&m', 'zara'],
  'Electronics': ['electronic', 'tech', 'apple', 'best buy', 'computer', 'phone'],
  'Bills & Utilities': ['bill', 'utility', 'utilities'],
  'Electricity': ['electric', 'power', 'energy'],
  'Water': ['water'],
  'Internet': ['internet', 'wifi', 'broadband', 'isp'],
  'Phone': ['phone', 'mobile', 'cellular', 'verizon', 'at&t', 't-mobile'],
  'Entertainment': ['entertainment', 'fun', 'leisure'],
  'Movies & Shows': ['movie', 'cinema', 'theater', 'netflix', 'hulu'],
  'Streaming Services': ['spotify', 'netflix', 'disney', 'hbo', 'streaming', 'subscription'],
  'Health & Wellness': ['health', 'wellness', 'medical', 'doctor', 'hospital'],
  'Pharmacy': ['pharmacy', 'cvs', 'walgreens', 'medicine', 'drug'],
  'Fitness': ['gym', 'fitness', 'workout', 'exercise'],
  'Education': ['education', 'school', 'university', 'college', 'course', 'tuition'],
  'Books': ['book', 'kindle', 'reading'],
  'Travel': ['travel', 'trip', 'vacation'],
  'Hotels': ['hotel', 'airbnb', 'lodging', 'accommodation'],
  'Flights': ['flight', 'airline', 'airport', 'aviation'],
  'Personal Care': ['personal care', 'grooming'],
  'Beauty': ['beauty', 'cosmetic', 'makeup', 'skincare'],
  'Haircare': ['hair', 'salon', 'barber', 'haircut'],
  'Pets': ['pet', 'vet', 'veterinary', 'dog', 'cat'],
  'Insurance': ['insurance'],
  'Salary': ['salary', 'payroll', 'wage', 'income', 'paycheck'],
  'Freelance': ['freelance', 'consulting', 'contract'],
  'Investment': ['investment', 'dividend', 'stock', 'interest'],
  'Gift': ['gift', 'present'],
  'Refund': ['refund', 'return', 'cashback'],
}

/**
 * Parse a CSV string into an array of objects
 */
export function parseCSVString(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header row
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const data: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header.trim().toLowerCase()] = values[idx].trim()
      })
      data.push(row)
    }
  }

  return data
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result.map(val => val.replace(/^"|"$/g, '').trim())
}

/**
 * Auto-detect column mapping from CSV headers
 */
export function autoDetectColumns(headers: string[]): CSVColumnMapping {
  const lowerHeaders = headers.map(h => h.toLowerCase())
  
  const mapping: CSVColumnMapping = {
    amount: '',
    date: '',
  }

  // Amount detection
  const amountKeywords = ['amount', 'value', 'total', 'sum', 'price', 'cost', 'money']
  for (const header of lowerHeaders) {
    if (amountKeywords.some(k => header.includes(k))) {
      mapping.amount = headers[lowerHeaders.indexOf(header)]
      break
    }
  }
  if (!mapping.amount && lowerHeaders.includes('amount')) {
    mapping.amount = headers[lowerHeaders.indexOf('amount')]
  }

  // Date detection
  const dateKeywords = ['date', 'time', 'when', 'day', 'timestamp']
  for (const header of lowerHeaders) {
    if (dateKeywords.some(k => header.includes(k))) {
      mapping.date = headers[lowerHeaders.indexOf(header)]
      break
    }
  }

  // Category detection
  const categoryKeywords = ['category', 'type', 'group', 'class']
  for (const header of lowerHeaders) {
    if (categoryKeywords.some(k => header.includes(k))) {
      mapping.category = headers[lowerHeaders.indexOf(header)]
      break
    }
  }

  // Note/Description detection
  const noteKeywords = ['note', 'description', 'memo', 'details', 'name', 'item']
  for (const header of lowerHeaders) {
    if (noteKeywords.some(k => header.includes(k))) {
      mapping.note = headers[lowerHeaders.indexOf(header)]
      break
    }
  }

  // Merchant detection
  const merchantKeywords = ['merchant', 'vendor', 'store', 'shop', 'payee', 'from', 'to']
  for (const header of lowerHeaders) {
    if (merchantKeywords.some(k => header.includes(k))) {
      mapping.merchant = headers[lowerHeaders.indexOf(header)]
      break
    }
  }

  // Type detection (income/expense)
  const typeKeywords = ['type', 'transaction type', 'kind', 'income/expense']
  for (const header of lowerHeaders) {
    if (typeKeywords.some(k => header === k)) {
      mapping.type = headers[lowerHeaders.indexOf(header)]
      break
    }
  }

  return mapping
}

/**
 * Parse date string trying multiple formats
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null

  // Try each format
  for (const dateFormat of DATE_FORMATS) {
    try {
      const parsed = parse(dateStr, dateFormat, new Date())
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd')
      }
    } catch {
      continue
    }
  }

  // Try native Date parsing as fallback
  try {
    const parsed = new Date(dateStr)
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd')
    }
  } catch {
    // Ignore
  }

  return null
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null

  // Remove currency symbols and whitespace
  let cleaned = amountStr.replace(/[$€£¥₹₫₩฿,\s]/g, '')
  
  // Handle negative amounts (parentheses or minus)
  const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(')
  cleaned = cleaned.replace(/[()\\-]/g, '')

  const amount = parseFloat(cleaned)
  if (isNaN(amount)) return null

  return isNegative ? -amount : amount
}

/**
 * Detect category from text
 */
function detectCategory(text: string): string {
  const lowerText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }

  return 'Other'
}

/**
 * Detect transaction type from amount or text
 */
function detectType(amount: number, text?: string): 'expense' | 'income' {
  // If amount is negative, it's typically an expense in bank statements
  // But some formats use positive for expenses and negative for income
  
  // Check text for income indicators
  if (text) {
    const lowerText = text.toLowerCase()
    const incomeKeywords = ['salary', 'income', 'deposit', 'transfer in', 'refund', 'cashback', 'dividend', 'interest', 'payment received']
    if (incomeKeywords.some(k => lowerText.includes(k))) {
      return 'income'
    }
  }

  // Default: positive = expense (user spent money), negative could be refund
  return 'expense'
}

/**
 * Parse CSV data into transactions
 */
export function parseCSVToTransactions(
  csvData: Record<string, string>[],
  mapping: CSVColumnMapping
): CSVParseResult {
  const transactions: Omit<Transaction, 'id'>[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    const rowNum = i + 2 // +2 for header row and 0-indexing

    try {
      // Parse amount (required)
      const amountStr = row[mapping.amount.toLowerCase()]
      const amount = parseAmount(amountStr)
      if (amount === null || amount === 0) {
        errors.push(`Row ${rowNum}: Invalid or missing amount "${amountStr}"`)
        skipped++
        continue
      }

      // Parse date (required)
      const dateStr = row[mapping.date.toLowerCase()]
      const date = parseDate(dateStr)
      if (!date) {
        errors.push(`Row ${rowNum}: Invalid or missing date "${dateStr}"`)
        skipped++
        continue
      }

      // Parse optional fields
      const note = mapping.note ? row[mapping.note.toLowerCase()] || '' : ''
      const merchant = mapping.merchant ? row[mapping.merchant.toLowerCase()] || '' : ''
      const categoryFromCSV = mapping.category ? row[mapping.category.toLowerCase()] || '' : ''
      const typeFromCSV = mapping.type ? row[mapping.type.toLowerCase()] || '' : ''

      // Detect category if not provided
      let category = categoryFromCSV
      if (!category || category === 'Other' || category === 'Uncategorized') {
        category = detectCategory(`${note} ${merchant}`)
      }

      // Detect type if not provided
      let type: 'expense' | 'income' = 'expense'
      if (typeFromCSV) {
        const lowerType = typeFromCSV.toLowerCase()
        if (lowerType.includes('income') || lowerType.includes('credit') || lowerType.includes('deposit')) {
          type = 'income'
        }
      } else {
        type = detectType(amount, `${note} ${merchant}`)
      }

      transactions.push({
        amount: Math.abs(amount),
        date,
        category,
        note: note || merchant || 'CSV Import',
        type,
        merchant: merchant || undefined,
      })
    } catch (err) {
      errors.push(`Row ${rowNum}: Failed to parse - ${err}`)
      skipped++
    }
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors: errors.slice(0, 10), // Limit errors shown
    skipped,
    total: csvData.length,
  }
}

/**
 * Get CSV headers from file
 */
export function getCSVHeaders(csvString: string): string[] {
  const firstLine = csvString.trim().split('\n')[0]
  return parseCSVLine(firstLine).map(h => h.trim())
}

/**
 * Generate sample CSV content
 */
export function generateSampleCSV(): string {
  return `date,amount,category,note,merchant,type
2025-11-01,45.50,Groceries,Weekly groceries,Walmart,expense
2025-11-02,12.99,Coffee & Cafe,Morning coffee,Starbucks,expense
2025-11-03,2700.00,Salary,Monthly salary,,income
2025-11-05,89.99,Shopping,New headphones,Amazon,expense
2025-11-07,15.99,Streaming Services,Monthly subscription,Netflix,expense`
}

