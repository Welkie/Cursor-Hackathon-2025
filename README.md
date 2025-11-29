# Personal Finance App

A modern, fully functional personal finance management application built with Next.js, TypeScript, and TailwindCSS. This app runs entirely locally without any backend servers or external APIs - all data is stored in LocalStorage.

## ✨ Features

### 📊 Dashboard
- **Financial Overview**: Real-time summary of income, expenses, and net balance
- **Interactive Charts**: Visual spending breakdown by category and time period
- **AI Spending Insights**: Rule-based AI insights about your spending patterns
- **Forecasting**: Projected monthly expenses based on recurring transactions
- **Quick Actions**: Fast access to all features

### 💰 Transactions
- **CRUD Operations**: Add, edit, and delete transactions with ease
- **Smart Categorization**: Pre-defined categories for expenses and income
- **Subscription Marking**: Mark transactions as subscriptions with date ranges
- **Receipt Scanner**: Upload receipt images and extract transaction details (simulated OCR)
- **CSV Import**: Bulk import transactions from CSV files with column mapping
- **Advanced Sorting**: Sort by date with same-day transactions ordered by creation time
- **Visual Indicators**: Category color dots and subscription badges

### 🎯 Goal Driven Budget
- **Create Goals**: Set financial targets with target amounts and dates
- **Progress Tracking**: Visual progress bars showing completion percentage
- **Weekly Savings Calculator**: Automatic calculation of suggested weekly savings
- **Goal Completion**: Mark goals as completed with automatic detection
- **Goal Management**: Edit, delete, and reactivate completed goals
- **Progress Visualization**: Beautiful progress indicators and completion celebrations

### 🔍 Subscription Radar
- **Automatic Detection**: Pattern-based detection of recurring subscriptions
- **Manual Marking**: Mark transactions as subscriptions for better detection
- **Smart Grouping**: Groups transactions by merchant and category
- **Frequency Detection**: Identifies monthly and yearly subscriptions
- **Subscription Management**: View all subscriptions with next billing dates
- **Cancellation Support**: Cancel subscriptions with automatic date tracking
- **Cost Analysis**: Monthly and yearly subscription cost summaries

### 🤖 AI Spending Mind
- **Spending Insights**: Rule-based analysis of your financial patterns
- **Category Analysis**: Identifies spending trends by category
- **Weekly Comparisons**: Compares current week with previous week
- **Monthly Summaries**: Provides monthly spending overviews
- **Smart Recommendations**: Suggests ways to optimize spending

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom CSS variables
- **State Management**: Zustand for global state
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Storage**: LocalStorage (browser-based)
- **UI Components**: Custom component library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-finance-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

That's it! No API keys, no backend setup, no database configuration needed.

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
personal-finance-app/
├── app/                      # Next.js app router pages
│   ├── dashboard/           # Main dashboard page
│   ├── transactions/        # Transactions management page
│   ├── subscriptions/       # Subscriptions page
│   ├── goals/               # Financial goals page
│   ├── api/                 # API routes
│   │   └── ocr/            # OCR simulation endpoint
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout
│   └── providers.tsx        # App providers
├── components/              # Reusable React components
│   ├── ui/                  # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Select.tsx
│   ├── charts/              # Chart components
│   │   ├── CategoryChart.tsx
│   │   └── ExpenseChart.tsx
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── ForecastCard.tsx
│   │   └── InsightsPanel.tsx
│   ├── layout/              # Layout components
│   │   └── Navbar.tsx
│   └── transactions/        # Transaction-related components
│       ├── CSVImporter.tsx
│       └── ReceiptScanner.tsx
├── store/                   # State management
│   └── useFinanceStore.ts   # Zustand store
├── utils/                   # Utility functions
│   ├── categories.ts        # Category definitions and colors
│   ├── csvParser.ts         # CSV parsing utilities
│   ├── forecasting.ts       # Expense forecasting logic
│   ├── insights.ts          # AI insights generation
│   ├── localStorage.ts      # LocalStorage helpers
│   ├── mockData.ts          # Mock data generation
│   └── subscriptionDetection.ts  # Subscription detection algorithm
├── types/                   # TypeScript type definitions
│   └── index.ts
└── hooks/                   # Custom React hooks
```

## 📖 Usage Guide

### Adding Transactions

1. Click "Add Transaction" button
2. Select transaction type (Expense or Income)
3. Enter amount, category, merchant (optional), note, and date
4. For expenses, optionally mark as subscription with date range
5. Click "Add Transaction" to save

### Creating Goals

1. Navigate to Goals page
2. Click "Create Goal"
3. Enter goal title, target amount, current amount, and optional target date
4. Track progress and add money as you save
5. Mark as complete when goal is achieved

### Using Receipt Scanner

1. Click "Scan Receipt" button
2. Upload a receipt image (JPG, PNG, or WebP)
3. Wait for OCR processing (simulated)
4. Review and edit extracted data
5. Save as transaction

### Importing CSV

1. Click "Import CSV" button
2. Upload your CSV file or download sample template
3. Map columns (Amount and Date are required)
4. Preview imported transactions
5. Confirm import

### Managing Subscriptions

- Subscriptions are automatically detected from transaction patterns
- Manually mark transactions as subscriptions for better detection
- View all subscriptions on the Subscriptions page
- Cancel subscriptions when they end
- Track monthly and yearly subscription costs

## 🎨 UI/UX Features

- **Modern Design**: Clean, Apple Finance App-inspired interface
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Transitions and hover effects
- **Visual Feedback**: Loading states, success messages, and error handling
- **Accessibility**: Keyboard navigation and ARIA labels
- **High Contrast**: Improved modal visibility and form readability

## 💾 Data Storage

All data is stored in your browser's LocalStorage. This means:

- ✅ Your data stays on your device (privacy-first)
- ✅ No account creation required
- ✅ Data persists between sessions
- ✅ Works offline
- ⚠️ Clearing browser data will reset the app
- ⚠️ Data is browser-specific (not synced across devices)

### Data Structure

- **Transactions**: Stored with ID, amount, category, date, type, merchant, and subscription info
- **Goals**: Stored with ID, title, target amount, current amount, target date, and completion status
- **Subscriptions**: Auto-detected and stored with merchant, amount, frequency, and billing dates
- **Insights**: Generated on-the-fly from transaction data

## 🔧 Recent Improvements

### UI/UX Enhancements
- Improved modal visibility with better contrast
- Enhanced form inputs with better styling
- Better visual hierarchy and spacing
- Improved mobile responsiveness
- Enhanced subscription section design

### Feature Updates
- Subscription cancellation functionality
- Goal completion tracking
- CSV import with column mapping
- Transaction sorting improvements
- Better subscription detection algorithm

### Bug Fixes
- Fixed receipt scanner state reset on error
- Fixed forecasting over-counting for weekly/biweekly transactions
- Improved subscription detection accuracy
- Fixed transaction sorting for same-day entries

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configuration included
- Consistent component structure
- Utility-first CSS with TailwindCSS

## 📝 Notes

- **OCR Simulation**: The receipt scanner uses simulated OCR - it doesn't actually process images. You'll need to manually verify and edit extracted data.
- **Subscription Detection**: Works best with consistent merchant names and similar amounts. Marking transactions as subscriptions improves detection accuracy.
- **Data Migration**: The app includes migration logic to handle schema changes in LocalStorage data.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Chart.js](https://www.chartjs.org/)

---

**Enjoy managing your finances! 💰**
