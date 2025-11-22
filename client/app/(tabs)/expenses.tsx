import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Transaction, TransactionType } from '@/src/types';
import { formatCurrency, formatDate, getDateRange } from '@/src/utils/helpers';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Header } from '@/components/header';

export default function ExpensesScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const theme = useAppTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | undefined>(undefined);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const dynamicStyles = getStyles(theme);
  const router = useRouter();

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dateRange = filter !== 'all' ? getDateRange(filter) : {};
      const response = await apiService.getTransactions({
        search: searchQuery || undefined,
        limit: 50,
        transactionType: transactionTypeFilter,
        ...dateRange,
      });
      setTransactions(response.transactions || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      let errorMessage = 'Failed to load transactions';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        // Handle wrapped error response
        const data = errorData.data || errorData;
        errorMessage = typeof data === 'string' 
          ? data 
          : data?.message || data?.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Ensure it's always a string
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter, transactionTypeFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isCredit = item.transactionType === TransactionType.CREDIT;
    const amountColor = isCredit ? theme.colors.success : theme.colors.error;
    
    return (
      <TouchableOpacity
        style={dynamicStyles.transactionCard}
        onPress={() => router.push(`/transaction-detail?id=${item.id}`)}
      >
        <View style={dynamicStyles.transactionHeader}>
          <View style={dynamicStyles.transactionInfo}>
            <Text style={dynamicStyles.transactionDescription}>{item.description}</Text>
            <View style={dynamicStyles.transactionTypeBadge}>
              <Text style={[dynamicStyles.transactionTypeText, { color: amountColor }]}>
                {isCredit ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>
          <Text style={[dynamicStyles.transactionAmount, { color: amountColor }]}>
            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={dynamicStyles.transactionFooter}>
          <Text style={dynamicStyles.transactionDate}>{formatDate(item.date)}</Text>
          {item.category && (
            <View style={[dynamicStyles.categoryBadge, { backgroundColor: item.category.color }]}>
              <Text style={dynamicStyles.categoryText}>{item.category.name}</Text>
            </View>
          )}
          <Text style={dynamicStyles.paymentMethod}>{item.paymentMethod}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Transactions" />
      <View style={dynamicStyles.header}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={dynamicStyles.filterContainer}>
          <TouchableOpacity
            style={[
              dynamicStyles.typeFilterButton,
              transactionTypeFilter === undefined && dynamicStyles.typeFilterButtonActive,
            ]}
            onPress={() => setTransactionTypeFilter(undefined)}
          >
            <Text style={[dynamicStyles.typeFilterText, transactionTypeFilter === undefined && dynamicStyles.typeFilterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              dynamicStyles.typeFilterButton,
              transactionTypeFilter === TransactionType.CREDIT && dynamicStyles.typeFilterButtonActive,
              transactionTypeFilter === TransactionType.CREDIT && { backgroundColor: theme.colors.success },
            ]}
            onPress={() => setTransactionTypeFilter(TransactionType.CREDIT)}
          >
            <Text style={[dynamicStyles.typeFilterText, transactionTypeFilter === TransactionType.CREDIT && dynamicStyles.typeFilterTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              dynamicStyles.typeFilterButton,
              transactionTypeFilter === TransactionType.DEBIT && dynamicStyles.typeFilterButtonActive,
              transactionTypeFilter === TransactionType.DEBIT && { backgroundColor: theme.colors.error },
            ]}
            onPress={() => setTransactionTypeFilter(TransactionType.DEBIT)}
          >
            <Text style={[dynamicStyles.typeFilterText, transactionTypeFilter === TransactionType.DEBIT && dynamicStyles.typeFilterTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
        </View>
        <View style={dynamicStyles.filterContainer}>
          {(['all', 'today', 'week', 'month'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[dynamicStyles.filterButton, filter === f && dynamicStyles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[dynamicStyles.filterText, filter === f && dynamicStyles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && transactions.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={[dynamicStyles.emptyText, { color: theme.colors.error }]}>
            {typeof error === 'string' ? error : 'Failed to load transactions'}
          </Text>
          <TouchableOpacity
            style={[dynamicStyles.button, { marginTop: 16 }]}
            onPress={loadTransactions}
          >
            <Text style={dynamicStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>No transactions found</Text>
              <Text style={[dynamicStyles.emptyText, { fontSize: 14, marginTop: 8 }]}>
                {filter !== 'all' ? `Try changing the filter or add a new transaction` : 'Add your first transaction to get started'}
              </Text>
            </View>
          }
        />
      )}

      <View style={dynamicStyles.fabContainer}>
        <TouchableOpacity
          style={[dynamicStyles.fab, { backgroundColor: theme.colors.success, marginRight: 8 }]}
          onPress={() => router.push('/add-transaction?type=debit')}
        >
          <Text style={dynamicStyles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: theme.colors.cardBackground,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.secondaryBackground,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.styles.shadow,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  transactionTypeBadge: {
    alignSelf: 'flex-start',
  },
  transactionTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  typeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.secondaryBackground,
    marginRight: 8,
  },
  typeFilterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  typeFilterText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  typeFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 'auto',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.styles.shadow,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

