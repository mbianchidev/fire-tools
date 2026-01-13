/**
 * Expense and Income Tracker Types
 */

import { SupportedCurrency } from './currency';

// Transaction categories for expenses
export type ExpenseCategory = 
  | 'HOUSING'
  | 'UTILITIES'
  | 'TRANSPORTATION'
  | 'GROCERIES'
  | 'DINING_OUT'
  | 'HEALTHCARE'
  | 'INSURANCE'
  | 'ENTERTAINMENT'
  | 'SHOPPING'
  | 'PERSONAL_CARE'
  | 'EDUCATION'
  | 'DEBT_PAYMENTS'
  | 'BUSINESS'
  | 'FEES'
  | 'LIFESTYLE_LEISURE'
  | 'COLLECTIBLES'
  | 'MUSIC'
  | 'TRAVEL'
  | 'HOLIDAYS'
  | 'GIFTS_DONATIONS'
  | 'SUBSCRIPTIONS'
  | 'OTHER';

// Needs vs Wants classification for 50/30/20 rule
export type ExpenseType = 'NEED' | 'WANT';

// Income source types
export type IncomeSource = 
  | 'SALARY'
  | 'FREELANCE'
  | 'BUSINESS'
  | 'INVESTMENTS'
  | 'RENTAL'
  | 'PENSION'
  | 'SOCIAL_SECURITY'
  | 'BONUS'
  | 'GIFT'
  | 'OTHER';

// Base transaction interface
export interface Transaction {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number;
  description: string;
  currency?: SupportedCurrency;
  isRecurring?: boolean; // Whether this is a recurring transaction
}

// Income entry
export interface IncomeEntry extends Transaction {
  type: 'income';
  source: IncomeSource;
}

// Expense entry
export interface ExpenseEntry extends Transaction {
  type: 'expense';
  category: ExpenseCategory;
  subCategory?: string;
  expenseType: ExpenseType; // Need vs Want
}

// Budget for a specific category
export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyBudget: number;
  currency?: SupportedCurrency;
}

// Month data container
export interface MonthData {
  year: number;
  month: number; // 1-12
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  budgets: CategoryBudget[];
  isClosed?: boolean; // Month can be marked as closed but still editable
}

// Year data container
export interface YearData {
  year: number;
  months: MonthData[];
  isArchived?: boolean;
}

// Summary statistics
export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsAmount: number;
  savingsRate: number; // As percentage
}

// Category breakdown
export interface CategoryBreakdown {
  category: ExpenseCategory;
  totalAmount: number;
  percentage: number;
  budgeted?: number;
  remaining?: number;
  transactionCount: number;
}

// 50/30/20 breakdown
export interface BudgetRuleBreakdown {
  needs: {
    amount: number;
    percentage: number;
    targetPercentage: 50;
    categories: CategoryBreakdown[];
  };
  wants: {
    amount: number;
    percentage: number;
    targetPercentage: 30;
    categories: CategoryBreakdown[];
  };
  savings: {
    amount: number;
    percentage: number;
    targetPercentage: 20;
  };
}

// Time period for aggregations
export type TimePeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

// Period breakdown for tables
export interface PeriodBreakdown {
  period: string; // e.g., "2024-01", "2024-Q1", "2024"
  periodType: TimePeriod;
  categories: CategoryBreakdown[];
  totalExpenses: number;
  totalIncome: number;
}

// Chart data types
export interface MonthlyComparisonData {
  month: string;
  expenses: number;
  income: number;
  average?: number;
}

export interface CategoryTrendData {
  month: string;
  [category: string]: number | string;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

// Filter and sort options
export type SortField = 'date' | 'amount' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  filterDate?: string; // Exact date filter (e.g., "2026-01-15")
  category?: ExpenseCategory;
  incomeSource?: IncomeSource;
  expenseType?: ExpenseType;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  isRecurring?: boolean; // Filter for recurring transactions
}

export interface TransactionSort {
  field: SortField;
  direction: SortDirection;
}

// Main expense tracker state
export interface ExpenseTrackerData {
  years: YearData[];
  currentYear: number;
  currentMonth: number;
  currency: SupportedCurrency;
  globalBudgets: CategoryBudget[]; // Global budgets that apply to all months
}

// Category display info
export interface CategoryInfo {
  id: ExpenseCategory;
  name: string;
  icon: string;
  defaultExpenseType: ExpenseType;
}

// Default categories configuration
export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'HOUSING', name: 'Housing', icon: 'home', defaultExpenseType: 'NEED' },
  { id: 'UTILITIES', name: 'Utilities', icon: 'lightbulb', defaultExpenseType: 'NEED' },
  { id: 'TRANSPORTATION', name: 'Transportation', icon: 'directions_car', defaultExpenseType: 'NEED' },
  { id: 'GROCERIES', name: 'Groceries', icon: 'shopping_cart', defaultExpenseType: 'NEED' },
  { id: 'DINING_OUT', name: 'Dining Out', icon: 'restaurant', defaultExpenseType: 'WANT' },
  { id: 'HEALTHCARE', name: 'Healthcare', icon: 'local_hospital', defaultExpenseType: 'NEED' },
  { id: 'INSURANCE', name: 'Insurance', icon: 'security', defaultExpenseType: 'NEED' },
  { id: 'ENTERTAINMENT', name: 'Entertainment', icon: 'movie', defaultExpenseType: 'WANT' },
  { id: 'SHOPPING', name: 'Shopping', icon: 'shopping_bag', defaultExpenseType: 'WANT' },
  { id: 'PERSONAL_CARE', name: 'Personal Care', icon: 'spa', defaultExpenseType: 'WANT' },
  { id: 'EDUCATION', name: 'Education', icon: 'school', defaultExpenseType: 'NEED' },
  { id: 'DEBT_PAYMENTS', name: 'Debt Payments', icon: 'credit_card', defaultExpenseType: 'NEED' },
  { id: 'BUSINESS', name: 'Business', icon: 'work', defaultExpenseType: 'NEED' },
  { id: 'FEES', name: 'Fees', icon: 'receipt_long', defaultExpenseType: 'NEED' },
  { id: 'LIFESTYLE_LEISURE', name: 'Lifestyle & Leisure', icon: 'self_improvement', defaultExpenseType: 'WANT' },
  { id: 'COLLECTIBLES', name: 'Collectibles', icon: 'emoji_events', defaultExpenseType: 'WANT' },
  { id: 'MUSIC', name: 'Music', icon: 'music_note', defaultExpenseType: 'NEED' },
  { id: 'TRAVEL', name: 'Travel', icon: 'flight', defaultExpenseType: 'WANT' },
  { id: 'HOLIDAYS', name: 'Holidays', icon: 'beach_access', defaultExpenseType: 'WANT' },
  { id: 'GIFTS_DONATIONS', name: 'Gifts & Donations', icon: 'redeem', defaultExpenseType: 'WANT' },
  { id: 'SUBSCRIPTIONS', name: 'Subscriptions', icon: 'subscriptions', defaultExpenseType: 'WANT' },
  { id: 'OTHER', name: 'Other', icon: 'inventory_2', defaultExpenseType: 'WANT' },
];

// Income source display info
export interface IncomeSourceInfo {
  id: IncomeSource;
  name: string;
  icon: string;
}

export const INCOME_SOURCES: IncomeSourceInfo[] = [
  { id: 'SALARY', name: 'Salary', icon: 'work' },
  { id: 'FREELANCE', name: 'Freelance', icon: 'computer' },
  { id: 'BUSINESS', name: 'Business', icon: 'business' },
  { id: 'INVESTMENTS', name: 'Investments', icon: 'trending_up' },
  { id: 'RENTAL', name: 'Rental', icon: 'home' },
  { id: 'PENSION', name: 'Pension', icon: 'elderly' },
  { id: 'SOCIAL_SECURITY', name: 'Social Security', icon: 'account_balance' },
  { id: 'BONUS', name: 'Bonus', icon: 'celebration' },
  { id: 'GIFT', name: 'Gift', icon: 'redeem' },
  { id: 'OTHER', name: 'Other', icon: 'attach_money' },
];

// Helper function to get category info
export function getCategoryInfo(category: ExpenseCategory): CategoryInfo {
  return EXPENSE_CATEGORIES.find(c => c.id === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

// Helper function to get income source info
export function getIncomeSourceInfo(source: IncomeSource): IncomeSourceInfo {
  return INCOME_SOURCES.find(s => s.id === source) || INCOME_SOURCES[INCOME_SOURCES.length - 1];
}

// Helper to format month key (for storage/lookup)
export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Helper to parse month key
export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

// Helper to get current month key
export function getCurrentMonthKey(): string {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth() + 1);
}

// Default empty month data
export function createEmptyMonthData(year: number, month: number): MonthData {
  return {
    year,
    month,
    incomes: [],
    expenses: [],
    budgets: [],
    isClosed: false,
  };
}

// Default empty year data
export function createEmptyYearData(year: number): YearData {
  return {
    year,
    months: [],
    isArchived: false,
  };
}

// Generate unique ID
export function generateTransactionId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
