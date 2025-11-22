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
import { Expense } from '@/src/types';
import { formatCurrency, formatDate, formatDateTime } from '@/src/utils/helpers';

export default function ExpenseDetailScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    try {
      const data = await apiService.getExpense(id);
      setExpense(data);
    } catch (error) {
      console.error('Error loading expense:', error);
      Alert.alert('Error', 'Failed to load expense');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await apiService.deleteExpense(id);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading || !expense) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          <Text style={styles.description}>{expense.description}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(expense.date)}</Text>
          </View>

          {expense.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <View style={styles.categoryBadge}>
                <View
                  style={[styles.categoryDot, { backgroundColor: expense.category.color }]}
                />
                <Text style={styles.categoryText}>{expense.category.name}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{expense.paymentMethod}</Text>
          </View>

          {expense.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{formatDateTime(expense.createdAt)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => router.push(`/add-expense?id=${expense.id}`)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  description: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  notesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notesText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 8,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#6366f1',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

