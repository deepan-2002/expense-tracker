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

export default function StatisticsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Expenses</Text>
          <Text style={styles.totalAmount}>
            {stats ? formatCurrency(stats.total) : '₹0.00'}
          </Text>
        </View>

        {stats && stats.byCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {stats.byCategory.map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryColor,
                      { backgroundColor: item.categoryColor || '#ccc' },
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {item.categoryName}
                  </Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {stats && stats.byPaymentMethod.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Payment Method</Text>
            {stats.byPaymentMethod.map((item, index) => (
              <View key={index} style={styles.paymentItem}>
                <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
                <View>
                  <Text style={styles.paymentValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={styles.paymentCount}>
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {monthly.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            {monthly.map((item) => (
              <View key={item.month} style={styles.monthlyItem}>
                <Text style={styles.monthName}>
                  {getMonthName(item.month)}
                </Text>
                <View>
                  <Text style={styles.monthlyValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={styles.monthlyCount}>
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

const styles = StyleSheet.create({
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#6366f1',
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
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#1a1a1a',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  paymentCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  monthlyCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

