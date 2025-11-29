// Extended categories for better expense tracking with intelligent grouping
export const EXPENSE_CATEGORIES = [
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

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

// Category groups for better organization and reporting
export const CATEGORY_GROUPS: Record<string, ExpenseCategory[]> = {
  'Food & Beverages': ['Food & Dining', 'Groceries', 'Coffee & Cafe', 'Fast Food', 'Restaurant'],
  'Transportation': ['Transport', 'Gas & Fuel', 'Public Transit', 'Rideshare'],
  'Shopping & Retail': ['Shopping', 'Clothing', 'Electronics', 'Home & Garden'],
  'Utilities & Bills': ['Bills & Utilities', 'Electricity', 'Water', 'Internet', 'Phone'],
  'Entertainment & Media': ['Entertainment', 'Movies & Shows', 'Gaming', 'Streaming Services'],
  'Health & Medical': ['Health & Wellness', 'Pharmacy', 'Medical', 'Fitness'],
  'Education & Learning': ['Education', 'Books', 'Courses'],
  'Travel & Vacation': ['Travel', 'Hotels', 'Flights'],
  'Personal': ['Personal Care', 'Beauty', 'Haircare'],
  'Other': ['Pets', 'Insurance', 'Subscriptions', 'Gifts', 'Charity', 'Other'],
}

// Category colors for charts
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF6B6B',
  'Groceries': '#4ECDC4',
  'Coffee & Cafe': '#8B4513',
  'Fast Food': '#FFE66D',
  'Restaurant': '#FF8C42',
  'Transport': '#95E1D3',
  'Gas & Fuel': '#3D5A80',
  'Public Transit': '#98C1D9',
  'Rideshare': '#293241',
  'Shopping': '#F38181',
  'Clothing': '#AA96DA',
  'Electronics': '#6C5CE7',
  'Home & Garden': '#00B894',
  'Bills & Utilities': '#636E72',
  'Electricity': '#FDCB6E',
  'Water': '#74B9FF',
  'Internet': '#0984E3',
  'Phone': '#00CEC9',
  'Entertainment': '#E17055',
  'Movies & Shows': '#D63031',
  'Gaming': '#6C5CE7',
  'Streaming Services': '#E84393',
  'Health & Wellness': '#00B894',
  'Pharmacy': '#55EFC4',
  'Medical': '#81ECEC',
  'Fitness': '#00CEC9',
  'Education': '#A29BFE',
  'Books': '#DDA0DD',
  'Courses': '#9B59B6',
  'Travel': '#1ABC9C',
  'Hotels': '#3498DB',
  'Flights': '#2980B9',
  'Personal Care': '#F8B500',
  'Beauty': '#FF69B4',
  'Haircare': '#FF1493',
  'Pets': '#FD79A8',
  'Insurance': '#636E72',
  'Subscriptions': '#B2BEC3',
  'Gifts': '#E84393',
  'Charity': '#E056FD',
  'Other': '#95A5A6',
}

// Get parent category group
export function getCategoryGroup(category: string): string {
  for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
    if (categories.includes(category as ExpenseCategory)) {
      return group
    }
  }
  return 'Other'
}

// Get category color
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#95A5A6'
}

// Legacy categories mapping for backward compatibility
export const LEGACY_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  'Food': 'Food & Dining',
  'Transport': 'Transport',
  'Shopping': 'Shopping',
  'Bills': 'Bills & Utilities',
  'Entertainment': 'Entertainment',
  'Health': 'Health & Wellness',
  'Education': 'Education',
  'Other': 'Other',
}

// Convert legacy category to new category
export function migrateLegacyCategory(category: string): ExpenseCategory {
  return LEGACY_CATEGORY_MAP[category] || (category as ExpenseCategory) || 'Other'
}

