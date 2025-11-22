import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Transaction, TransactionType, BalanceResponse, Account } from '@/src/types';
import { formatCurrency, formatDate, getDateRange } from '@/src/utils/helpers';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function HomeScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [balances, setBalances] = useState<BalanceResponse[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dynamicStyles = getStyles(theme);

  const loadData = async () => {
    try {
      const [accountsData, balancesData, transactionsData] = await Promise.all([
        apiService.getAccounts(),
        apiService.getAllBalances(),
        apiService.getTransactions({ limit: 5 }),
      ]);
      setAccounts(accountsData);
      setBalances(balancesData);
      setRecentTransactions(transactionsData.transactions || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Set empty defaults on error
      setAccounts([]);
      setBalances([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated]);

  // Handle authentication redirect after all hooks
  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const userName = user?.fullName || user?.name || user?.username || 'User';

  return (
    <ThemedView style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.welcomeText}>Welcome back,</Text>
          <Text style={dynamicStyles.userName}>{userName}</Text>
        </View>

        <View style={dynamicStyles.accountsSection}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Accounts</Text>
            <TouchableOpacity onPress={() => router.push('/accounts')}>
              <Text style={dynamicStyles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>
          {balances.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>No accounts found</Text>
            </View>
          ) : (
            balances.map((balance) => (
              <TouchableOpacity
                key={balance.accountId}
                style={dynamicStyles.accountCard}
                onPress={() => router.push(`/(tabs)/expenses?accountId=${balance.accountId}`)}
              >
                <View style={dynamicStyles.accountHeader}>
                  <Text style={dynamicStyles.accountName}>{balance.accountName}</Text>
                  <Text style={dynamicStyles.accountBalance}>
                    {formatCurrency(balance.balance)}
                  </Text>
                </View>
                <View style={dynamicStyles.accountDetails}>
                  <View style={dynamicStyles.accountDetailItem}>
                    <Text style={dynamicStyles.accountDetailLabel}>Income</Text>
                    <Text style={[dynamicStyles.accountDetailValue, { color: '#10b981' }]}>
                      {formatCurrency(balance.totalCredit)}
                    </Text>
                  </View>
                  <View style={dynamicStyles.accountDetailItem}>
                    <Text style={dynamicStyles.accountDetailLabel}>Expenses</Text>
                    <Text style={[dynamicStyles.accountDetailValue, { color: '#ef4444' }]}>
                      {formatCurrency(balance.totalDebit)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={dynamicStyles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>No transactions yet</Text>
              <TouchableOpacity
                style={dynamicStyles.addButton}
                onPress={() => router.push('/add-transaction')}
              >
                <Text style={dynamicStyles.addButtonText}>Add Your First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentTransactions.map((transaction) => {
              const isCredit = transaction.transactionType === TransactionType.CREDIT;
              const amountColor = isCredit ? '#10b981' : '#ef4444';
              return (
                <TouchableOpacity
                  key={transaction.id}
                  style={dynamicStyles.transactionItem}
                  onPress={() => router.push(`/add-transaction?id=${transaction.id}`)}
                >
                  <View style={dynamicStyles.transactionItemLeft}>
                    {transaction.category && (
                      <View
                        style={[
                          dynamicStyles.categoryDot,
                          { backgroundColor: transaction.category.color },
                        ]}
                      />
                    )}
                    <View>
                      <Text style={dynamicStyles.transactionItemDescription}>{transaction.description}</Text>
                      <Text style={dynamicStyles.transactionItemDate}>{formatDate(transaction.date)}</Text>
                    </View>
                  </View>
                  <Text style={[dynamicStyles.transactionItemAmount, { color: amountColor }]}>
                    {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={dynamicStyles.fabContainer}>
        <TouchableOpacity
          style={[dynamicStyles.fab, { backgroundColor: '#10b981', marginRight: 8 }]}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  accountsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  accountCard: {
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.styles.shadow,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  accountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  accountDetailItem: {
    alignItems: 'center',
  },
  accountDetailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  accountDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.styles.shadow,
  },
  transactionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  transactionItemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  transactionItemDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionItemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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
});
