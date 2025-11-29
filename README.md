# Personal Finance App

A modern, fully functional personal finance management application built with Next.js, TypeScript, and TailwindCSS. This app runs entirely locally without any backend servers or external APIs - all data is stored in LocalStorage.

## Features

- **AI Spending Mind**: Get AI-style insights about your spending patterns (rule-based logic)
- **Goal Driven Budget**: Create financial goals and track progress with suggested weekly savings
- **Subscription Radar**: Automatically detect recurring payments based on transaction patterns
- **Receipt Scanner**: Upload receipts and manually extract transaction details (simulated OCR)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Storage**: LocalStorage

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

That's it! No API keys, no backend setup, no database configuration needed.

## Project Structure

```
/app                 # Next.js app router pages
  /dashboard         # Main dashboard page
  /transactions      # Transactions list page
  /subscriptions     # Subscriptions page
  /goals             # Financial goals page
/components          # Reusable React components
  /ui                # UI components (cards, modals, etc.)
/hooks               # Custom React hooks
/utils               # Utility functions
  /localStorage      # LocalStorage helpers
  /insights          # AI insights logic
  /subscriptions     # Subscription detection
/styles              # Global styles
```

## Features Overview

### Dashboard
- Overview of your financial status
- Spending charts and summaries
- Quick access to all features

### Transactions
- Add, edit, and delete transactions
- Categorize expenses
- View transaction history in a clean table

### AI Spending Mind
- Automatic insights based on your spending patterns
- Weekly and monthly comparisons
- Category analysis

### Goals
- Create financial goals (e.g., "Save $500 for Laptop")
- Track progress with visual progress bars
- Get suggested weekly saving amounts

### Subscription Radar
- Automatically detects recurring payments
- Identifies patterns in merchant names and categories
- Shows subscription list with monthly costs

### Receipt Scanner
- Upload receipt images
- Manual text extraction interface (simulated OCR)
- Convert to transactions

## Data Storage

All data is stored in your browser's LocalStorage. This means:
- Your data stays on your device
- No account creation required
- Data persists between sessions
- Clear browser data will reset the app

## Dark Mode

The app includes a dark mode toggle. Your preference is saved in LocalStorage.

## License

MIT

