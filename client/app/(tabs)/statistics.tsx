import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { ExpenseStats, MonthlyBreakdown } from '@/src/types';
import { formatCurrency, getMonthName } from '@/src/utils/helpers';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Header } from '@/components/header';

export default function StatisticsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const theme = useAppTheme();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const dynamicStyles = getStyles(theme);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const loadData = async () => {
    try {
      const [statsData, monthlyData] = await Promise.all([
        apiService.getExpenseStats(),
        apiService.getMonthlyBreakdown(),
      ]);
      setStats(statsData);
      setMonthly(monthlyData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Statistics" />
      <ScrollView
        style={dynamicStyles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.cardTitle}>Total Expenses</Text>
            <Text style={dynamicStyles.totalAmount}>
              {stats ? formatCurrency(stats.total) : '₹0.00'}
            </Text>
          </View>
        </View>

        {stats && stats.byCategory.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>By Category</Text>
            {stats.byCategory.map((item, index) => (
              <View key={index} style={dynamicStyles.categoryItem}>
                <View style={dynamicStyles.categoryInfo}>
                  <View
                    style={[
                      dynamicStyles.categoryColor,
                      { backgroundColor: item.categoryColor || theme.colors.textTertiary },
                    ]}
                  />
                  <Text style={dynamicStyles.categoryName}>
                    {item.categoryName}
                  </Text>
                </View>
                <View style={dynamicStyles.categoryAmount}>
                  <Text style={dynamicStyles.categoryValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={dynamicStyles.categoryCount}>
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {stats && stats.byPaymentMethod.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>By Payment Method</Text>
            {stats.byPaymentMethod.map((item, index) => (
              <View key={index} style={dynamicStyles.paymentItem}>
                <Text style={dynamicStyles.paymentMethod}>{item.paymentMethod}</Text>
                <View>
                  <Text style={dynamicStyles.paymentValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={dynamicStyles.paymentCount}>
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {monthly.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Monthly Breakdown</Text>
            {monthly.map((item) => (
              <View key={item.month} style={dynamicStyles.monthlyItem}>
                <Text style={dynamicStyles.monthName}>
                  {getMonthName(item.month)}
                </Text>
                <View>
                  <Text style={dynamicStyles.monthlyValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={dynamicStyles.monthlyCount}>
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  card: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  categoryItem: {
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
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  paymentItem: {
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
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
  },
  paymentCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  monthlyItem: {
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
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
  },
  monthlyCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

