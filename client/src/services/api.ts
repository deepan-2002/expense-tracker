import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  LoginDto,
  RegisterDto,
  AuthResponse,
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  QueryTransactionDto,
  PaginatedTransactionResponse,
  BalanceResponse,
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ExpenseStats,
  MonthlyBreakdown,
  PaginatedResponse,
  QueryExpenseDto,
} from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              // Unwrap the response from TransformInterceptor
              const refreshData = response.data?.data || response.data;
              const { accessToken, refreshToken: newRefreshToken } = refreshData;
              await AsyncStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                await AsyncStorage.setItem('refreshToken', newRefreshToken);
              }
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
            return Promise.reject(refreshError);
          }
        }

        // Format error response for better error handling
        if (error.response?.data) {
          const errorData = error.response.data as any;
          // If error is wrapped in data, unwrap it
          if (errorData.data) {
            error.response.data = errorData.data;
          }
          // Ensure message is a string
          if (errorData.message && typeof errorData.message !== 'string') {
            errorData.message = JSON.stringify(errorData.message);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Helper to unwrap response data (NestJS TransformInterceptor wraps responses)
  private unwrapResponse<T>(response: any): T {
    // Check if response is wrapped in a 'data' key (from TransformInterceptor)
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  }

  // Auth endpoints
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await this.api.post<{ data: AuthResponse }>('/auth/login', credentials);
    const authData = this.unwrapResponse<AuthResponse>(response);
    console.log('Login response unwrapped:', authData);
    
    const { accessToken, refreshToken, user } = authData;
    
    // Save tokens and user data
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    
    // Verify tokens were saved
    const savedToken = await AsyncStorage.getItem('accessToken');
    const savedUser = await AsyncStorage.getItem('user');
    console.log('Tokens saved:', { 
      hasToken: !!savedToken, 
      hasUser: !!savedUser,
      user: savedUser ? JSON.parse(savedUser) : null 
    });
    
    return authData;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.api.post<{ data: AuthResponse }>('/auth/register', data);
    const authData = this.unwrapResponse<AuthResponse>(response);
    // Don't save tokens - user needs to login separately
    // Tokens are returned but not stored, so user must login after registration
    return authData;
  }

  async logout(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await this.api.post('/auth/logout', { refreshToken });
      } catch (error) {
        // Ignore errors on logout
      }
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<{ data: User }>('/auth/me');
    const user = this.unwrapResponse<User>(response);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // User endpoints
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.patch<{ data: User }>('/users/me', data);
    const user = this.unwrapResponse<User>(response);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async updateOpeningBalance(openingBalance: number, openingBalanceDate?: string): Promise<User> {
    const response = await this.api.patch<{ data: User }>('/users/me/opening-balance', {
      openingBalance,
      openingBalanceDate,
    });
    const user = this.unwrapResponse<User>(response);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Expense endpoints
  async getExpenses(query?: QueryExpenseDto): Promise<PaginatedResponse<Expense>> {
    const response = await this.api.get<{ data: PaginatedResponse<Expense> }>('/expenses', {
      params: query,
    });
    return this.unwrapResponse<PaginatedResponse<Expense>>(response);
  }

  async getExpense(id: string): Promise<Expense> {
    const response = await this.api.get<{ data: Expense }>(`/expenses/${id}`);
    return this.unwrapResponse<Expense>(response);
  }

  async createExpense(data: CreateExpenseDto): Promise<Expense> {
    const response = await this.api.post<{ data: Expense }>('/expenses', data);
    return this.unwrapResponse<Expense>(response);
  }

  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const response = await this.api.patch<{ data: Expense }>(`/expenses/${id}`, data);
    return this.unwrapResponse<Expense>(response);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.api.delete(`/expenses/${id}`);
  }

  async getExpenseStats(startDate?: string, endDate?: string): Promise<ExpenseStats> {
    const response = await this.api.get<{ data: ExpenseStats }>('/expenses/stats', {
      params: { startDate, endDate },
    });
    return this.unwrapResponse<ExpenseStats>(response);
  }

  async getMonthlyBreakdown(year?: number): Promise<MonthlyBreakdown[]> {
    const response = await this.api.get<{ data: MonthlyBreakdown[] }>('/expenses/monthly', {
      params: { year },
    });
    return this.unwrapResponse<MonthlyBreakdown[]>(response);
  }

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<{ data: Category[] }>('/categories');
    return this.unwrapResponse<Category[]>(response);
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.api.get<{ data: Category }>(`/categories/${id}`);
    return this.unwrapResponse<Category>(response);
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await this.api.post<{ data: Category }>('/categories', data);
    return this.unwrapResponse<Category>(response);
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await this.api.patch<{ data: Category }>(`/categories/${id}`, data);
    return this.unwrapResponse<Category>(response);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Transaction endpoints (primary)
  async getTransactions(query?: QueryTransactionDto): Promise<PaginatedTransactionResponse> {
    const response = await this.api.get<{ data: PaginatedTransactionResponse }>('/transactions', {
      params: query,
    });
    return this.unwrapResponse<PaginatedTransactionResponse>(response);
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await this.api.get<{ data: Transaction }>(`/transactions/${id}`);
    return this.unwrapResponse<Transaction>(response);
  }

  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await this.api.post<{ data: Transaction }>('/transactions', data);
    return this.unwrapResponse<Transaction>(response);
  }

  async updateTransaction(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await this.api.patch<{ data: Transaction }>(`/transactions/${id}`, data);
    return this.unwrapResponse<Transaction>(response);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.api.delete(`/transactions/${id}`);
  }

  async getBalance(accountId: string): Promise<BalanceResponse> {
    const response = await this.api.get<{ data: BalanceResponse }>(`/transactions/balance/${accountId}`);
    return this.unwrapResponse<BalanceResponse>(response);
  }

  async getAllBalances(): Promise<BalanceResponse[]> {
    const response = await this.api.get<{ data: BalanceResponse[] }>('/transactions/balances');
    return this.unwrapResponse<BalanceResponse[]>(response);
  }

  // Account endpoints
  async getAccounts(): Promise<Account[]> {
    const response = await this.api.get<{ data: Account[] }>('/accounts');
    return this.unwrapResponse<Account[]>(response);
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.api.get<{ data: Account }>(`/accounts/${id}`);
    return this.unwrapResponse<Account>(response);
  }

  async createAccount(data: CreateAccountDto): Promise<Account> {
    const response = await this.api.post<{ data: Account }>('/accounts', data);
    return this.unwrapResponse<Account>(response);
  }

  async updateAccount(id: string, data: UpdateAccountDto): Promise<Account> {
    const response = await this.api.patch<{ data: Account }>(`/accounts/${id}`, data);
    return this.unwrapResponse<Account>(response);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.api.delete(`/accounts/${id}`);
  }

  async getTransactionStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await this.api.get<{ data: any }>('/transactions/stats', {
      params: { startDate, endDate },
    });
    return this.unwrapResponse<any>(response);
  }
}

export const apiService = new ApiService();

