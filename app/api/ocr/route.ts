import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Extended categories for better expense tracking
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Coffee & Cafe',
  'Fast Food',
  'Restaurant',
  'Transport',
  'Gas & Fuel',
  'Public Transit',
  'Rideshare',
  'Shopping',
  'Clothing',
  'Electronics',
  'Home & Garden',
  'Bills & Utilities',
  'Electricity',
  'Water',
  'Internet',
  'Phone',
  'Entertainment',
  'Movies & Shows',
  'Gaming',
  'Streaming Services',
  'Health & Wellness',
  'Pharmacy',
  'Medical',
  'Fitness',
  'Education',
  'Books',
  'Courses',
  'Travel',
  'Hotels',
  'Flights',
  'Personal Care',
  'Beauty',
  'Haircare',
  'Pets',
  'Insurance',
  'Subscriptions',
  'Gifts',
  'Charity',
  'Other',
] as const

interface OCRResult {
  success: boolean
  data?: {
    merchant: string
    amount: number
    originalCurrency?: string
    originalAmount?: number
    date: string
    category: string
    items: Array<{ name: string; price: number }>
    confidence: number
    rawText: string
  }
  error?: string
}

// Models to try in order of preference (will try each until one works)
// Gemini 2.5 Flash Lite - fastest and most cost-efficient model
const VISION_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

export async function POST(request: NextRequest): Promise<NextResponse<OCRResult>> {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg'

    // Try each model until one works
    let lastError: Error | null = null
    
    for (const modelName of VISION_MODELS) {
      try {
        console.log(`Trying model: ${modelName}`)
        const visionModel = genAI.getGenerativeModel({ model: modelName })

        // ============================================
        // STEP 1: OCR - Extract all text from receipt
        // (Simulating DeepSeek OCR functionality)
        // ============================================
        const ocrPrompt = `You are an OCR system. Extract ALL text visible in this receipt image exactly as it appears.
Include:
- Store/merchant name
- Address if visible
- All line items with prices
- Subtotal, tax, total
- Date and time
- Any other visible text

Return the raw text extraction, preserving the layout as much as possible.`

        const ocrResult = await visionModel.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          ocrPrompt,
        ])

        const ocrResponse = await ocrResult.response
        const rawText = ocrResponse.text()

        // ============================================
        // STEP 2: Classification - Analyze and categorize
        // Using Gemini to classify the extracted info
        // ============================================
        const classificationPrompt = `You are a receipt analyzer. Based on the following extracted receipt text, provide a JSON response with the structured data.

EXTRACTED RECEIPT TEXT:
"""
${rawText}
"""

Analyze this receipt and return ONLY valid JSON in this exact format:
{
  "merchant": "Store/Restaurant name",
  "amount": total amount CONVERTED TO USD as a number (just the number, no currency symbol),
  "originalCurrency": "original currency code (e.g., VND, EUR, GBP, JPY, KRW, THB, etc.)",
  "originalAmount": original amount before conversion as a number,
  "date": "YYYY-MM-DD format (use today's date if not clear)",
  "category": "Best matching category from this list: ${EXPENSE_CATEGORIES.join(', ')}",
  "items": [{"name": "item name", "price": price in USD as number}],
  "confidence": confidence score from 0 to 1
}

IMPORTANT CURRENCY CONVERSION RULES:
- ALWAYS convert the total amount and item prices to USD
- Use these approximate exchange rates:
  * VND (Vietnamese Dong): 1 USD = 25,000 VND
  * EUR (Euro): 1 USD = 0.92 EUR
  * GBP (British Pound): 1 USD = 0.79 GBP
  * JPY (Japanese Yen): 1 USD = 150 JPY
  * KRW (Korean Won): 1 USD = 1,350 KRW
  * THB (Thai Baht): 1 USD = 35 THB
  * CNY (Chinese Yuan): 1 USD = 7.2 CNY
  * INR (Indian Rupee): 1 USD = 83 INR
  * PHP (Philippine Peso): 1 USD = 56 PHP
  * MYR (Malaysian Ringgit): 1 USD = 4.7 MYR
  * SGD (Singapore Dollar): 1 USD = 1.35 SGD
  * AUD (Australian Dollar): 1 USD = 1.55 AUD
  * CAD (Canadian Dollar): 1 USD = 1.36 CAD
- If currency is already USD, keep as is
- Detect currency from symbols (₫, €, £, ¥, ₩, ฿, etc.) or text (VND, USD, EUR, etc.)

CATEGORY SELECTION RULES - Choose the MOST SPECIFIC category:
- Coffee shops (Starbucks, Dunkin, Tim Hortons, local cafes) → "Coffee & Cafe"
- Fast food (McDonald's, Burger King, Wendy's, Taco Bell, KFC, Chick-fil-A) → "Fast Food"
- Sit-down restaurants, diners → "Restaurant"
- Grocery stores (Walmart groceries, Kroger, Safeway, Whole Foods, Trader Joe's, Costco food) → "Groceries"
- Gas stations (Shell, Chevron, BP, Exxon, fuel purchases) → "Gas & Fuel"
- General retail (Target, Walmart general, Amazon) → "Shopping"
- Electronics stores (Best Buy, Apple Store, Micro Center) → "Electronics"
- Clothing stores (H&M, Zara, Nike, clothing purchases) → "Clothing"
- Pharmacies (CVS, Walgreens, Rite Aid) → "Pharmacy"
- Uber/Lyft rides → "Rideshare"
- Movie theaters, concerts → "Movies & Shows"
- Streaming receipts (Netflix, Spotify, Disney+) → "Streaming Services"
- Gym/fitness → "Fitness"
- Hotels/Airbnb → "Hotels"
- Airlines → "Flights"
- Pet stores, vet → "Pets"
- Hair salon/barber → "Haircare"
- Beauty/cosmetics → "Beauty"
- Phone/mobile data top-up, telecommunications → "Phone"
- Internet/WiFi services → "Internet"

Return ONLY the JSON object, no additional text or markdown.`

        const classifyResult = await visionModel.generateContent(classificationPrompt)
        const classifyResponse = await classifyResult.response
        const classifyText = classifyResponse.text()

        // Parse the JSON response
        let parsedData
        try {
          // Clean up the response - remove markdown code blocks if present
          const cleanedText = classifyText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
          parsedData = JSON.parse(cleanedText)
        } catch {
          console.error('Failed to parse classification response:', classifyText)
          
          // Fallback: try to extract basic info from raw text
          const amountMatch = rawText.match(/(?:total|amount|sum)[:\s]*\$?([\d,.]+)/i)
          const dateMatch = rawText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
          
          parsedData = {
            merchant: 'Unknown',
            amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 0,
            date: dateMatch ? formatDate(dateMatch[1]) : new Date().toISOString().split('T')[0],
            category: 'Other',
            items: [],
            confidence: 0.3,
          }
        }

        // Validate and normalize the response
        const normalizedData = {
          merchant: String(parsedData.merchant || 'Unknown'),
          amount: parseFloat(parsedData.amount) || 0,
          originalCurrency: parsedData.originalCurrency || 'USD',
          originalAmount: parseFloat(parsedData.originalAmount) || parseFloat(parsedData.amount) || 0,
          date: parsedData.date || new Date().toISOString().split('T')[0],
          category: EXPENSE_CATEGORIES.includes(parsedData.category) 
            ? parsedData.category 
            : 'Other',
          items: Array.isArray(parsedData.items) ? parsedData.items : [],
          confidence: parseFloat(parsedData.confidence) || 0.5,
          rawText: rawText,
        }

        console.log(`Successfully processed with model: ${modelName}`)
        
        return NextResponse.json({
          success: true,
          data: normalizedData,
        })

      } catch (error) {
        console.error(`Model ${modelName} failed:`, error)
        lastError = error as Error
        continue // Try next model
      }
    }

    // All models failed
    throw lastError || new Error('All AI models failed to process the image')

  } catch (error) {
    console.error('OCR processing error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process receipt'
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        errorMessage = 'AI model not available. Please verify your API key has access to Gemini vision models.'
      } else if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        errorMessage = 'Invalid API key. Please check your Gemini API key.'
      } else if (error.message.includes('quota') || error.message.includes('rate')) {
        errorMessage = 'API quota exceeded. Please try again later.'
      } else if (error.message.includes('not supported') || error.message.includes('not found')) {
        errorMessage = 'Vision model not available for your API key. Please check Google AI Studio for available models.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// Helper function to format date strings
function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split(/[\/\-]/)
    if (parts.length === 3) {
      let [month, day, year] = parts
      if (year.length === 2) {
        year = '20' + year
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  } catch {
    // Ignore parsing errors
  }
  return new Date().toISOString().split('T')[0]
}

// Export categories for use in other components
export const CATEGORIES = EXPENSE_CATEGORIES
