import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Transaction, TransactionType } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/utils/helpers';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';

export default function TransactionDetailScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!id) {
    return <Redirect href="/(tabs)/expenses" />;
  }

  const dynamicStyles = getStyles(theme);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransaction(id);
      setTransaction(data);
    } catch (error: any) {
      console.error('Error loading transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await apiService.deleteTransaction(id);
              Alert.alert('Success', 'Transaction deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete transaction');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdate = () => {
    router.push(`/add-transaction?id=${id}`);
  };

  if (loading) {
    return (
      <ThemedView style={dynamicStyles.container}>
        <Header title="Spendly" subtitle="Transaction Details" />
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading transaction...</Text>
        </View>
      </ThemedView>
    );
  }

  if (!transaction) {
    return (
      <ThemedView style={dynamicStyles.container}>
        <Header title="Spendly" subtitle="Transaction Details" />
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.errorText}>Transaction not found</Text>
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={() => router.back()}
          >
            <Text style={dynamicStyles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const isCredit = transaction.transactionType === TransactionType.CREDIT;
  const amountColor = isCredit ? theme.colors.success : theme.colors.error;

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Transaction Details" />
      <ScrollView style={dynamicStyles.scrollView}>
        <View style={dynamicStyles.content}>
          {/* Amount Section */}
          <View style={dynamicStyles.amountSection}>
            <Text style={dynamicStyles.amountLabel}>Amount</Text>
            <Text style={[dynamicStyles.amountValue, { color: amountColor }]}>
              {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <View style={[dynamicStyles.typeBadge, { backgroundColor: amountColor + '20' }]}>
              <Text style={[dynamicStyles.typeText, { color: amountColor }]}>
                {isCredit ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Details</Text>
            
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Description</Text>
              <Text style={dynamicStyles.detailValue}>{transaction.description}</Text>
            </View>

            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Date</Text>
              <Text style={dynamicStyles.detailValue}>{formatDate(transaction.date)}</Text>
            </View>

            {transaction.category && (
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Category</Text>
                <View style={[dynamicStyles.categoryBadge, { backgroundColor: transaction.category.color }]}>
                  <Text style={dynamicStyles.categoryText}>{transaction.category.name}</Text>
                </View>
              </View>
            )}

            {transaction.account && (
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Account</Text>
                <Text style={dynamicStyles.detailValue}>{transaction.account.name}</Text>
              </View>
            )}

            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Payment Method</Text>
              <Text style={dynamicStyles.detailValue}>{transaction.paymentMethod}</Text>
            </View>

            {transaction.notes && (
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Notes</Text>
                <Text style={dynamicStyles.detailValue}>{transaction.notes}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={dynamicStyles.actionsSection}>
            <TouchableOpacity
              style={[dynamicStyles.updateButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleUpdate}
            >
              <Text style={dynamicStyles.updateButtonText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.deleteButton, { backgroundColor: theme.colors.error }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={dynamicStyles.deleteButtonText}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  amountSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  amountLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    gap: 12,
    marginTop: 8,
  },
  updateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

