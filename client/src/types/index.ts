export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  CARD = 'card',
  OTHER = 'other',
}

export interface Account {
  id: string;
  userId: number;
  name: string;
  type: AccountType;
  openingBalance: number;
  openingBalanceDate?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  transactions?: Transaction[];
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  openingBalance?: number;
  openingBalanceDate?: string;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
  expenses?: Expense[]; // Keep for backward compatibility
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  UPI = 'UPI',
  OTHER = 'Other',
}

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  transactionType: TransactionType;
  accountId: string;
  account?: Account;
  categoryId?: string;
  category?: Category;
  userId: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Keep Expense for backward compatibility, but it's now a Transaction
export interface Expense extends Omit<Transaction, 'transactionType'> {
  transactionType?: TransactionType;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CreateTransactionDto {
  amount: number;
  description: string;
  date: string;
  transactionType: TransactionType;
  accountId: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

// Keep for backward compatibility
export interface CreateExpenseDto extends Omit<CreateTransactionDto, 'transactionType'> {
  transactionType?: TransactionType;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface ExpenseStats {
  total: number;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    total: number;
    count: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: PaymentMethod;
    total: number;
    count: number;
  }>;
}

export interface MonthlyBreakdown {
  month: number;
  total: number;
  count: number;
}

export interface PaginatedResponse<T> {
  expenses: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryTransactionDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  search?: string;
  transactionType?: TransactionType;
}

// Keep for backward compatibility
export interface QueryExpenseDto extends Omit<QueryTransactionDto, 'transactionType'> {
  transactionType?: TransactionType;
}

export interface PaginatedTransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BalanceResponse {
  accountId: string;
  accountName: string;
  openingBalance: number;
  openingBalanceDate?: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
}
