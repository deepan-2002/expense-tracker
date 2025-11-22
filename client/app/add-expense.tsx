import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Category, PaymentMethod, CreateExpenseDto, CreateTransactionDto, TransactionType } from '@/src/types';
import { formatCurrency } from '@/src/utils/helpers';

export default function AddExpenseScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateExpenseDto>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: undefined,
    paymentMethod: PaymentMethod.CASH,
    notes: '',
  });

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  useEffect(() => {
    loadCategories();
    if (id) {
      loadExpense();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExpense = async () => {
    try {
      const expense = await apiService.getExpense(id!);
      setFormData({
        amount: expense.amount,
        description: expense.description,
        date: expense.date.split('T')[0],
        categoryId: expense.categoryId,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || '',
      });
    } catch (error) {
      console.error('Error loading expense:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.description || formData.amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Convert to transaction format (debit for expenses)
      const transactionData: CreateTransactionDto = {
        ...formData,
        transactionType: TransactionType.DEBIT,
      };
      
      if (id) {
        await apiService.updateTransaction(id, transactionData);
      } else {
        await apiService.createTransaction(transactionData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.amount > 0 ? formData.amount.toString() : ''}
              onChangeText={(text) =>
                setFormData({ ...formData, amount: parseFloat(text) || 0 })
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you spend on?"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    formData.categoryId === category.id && styles.categoryChipActive,
                    { borderColor: category.color },
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      categoryId:
                        formData.categoryId === category.id ? undefined : category.id,
                    })
                  }
                >
                  <Text style={styles.categoryChipText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              {Object.values(PaymentMethod).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    formData.paymentMethod === method && styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, paymentMethod: method })}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      formData.paymentMethod === method && styles.paymentMethodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : id ? 'Update' : 'Save'}
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: '#f0f0ff',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

