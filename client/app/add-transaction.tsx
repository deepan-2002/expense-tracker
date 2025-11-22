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
import { Category, PaymentMethod, CreateTransactionDto, TransactionType, Account } from '@/src/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { z } from 'zod';

// Zod validation schema
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  transactionType: z.nativeEnum(TransactionType),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().optional(),
});

export default function AddTransactionScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateTransactionDto>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    transactionType: (type === 'credit' ? TransactionType.CREDIT : TransactionType.DEBIT) || TransactionType.DEBIT,
    accountId: '',
    categoryId: undefined,
    paymentMethod: PaymentMethod.CASH,
    notes: '',
  });

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  useEffect(() => {
    loadCategories();
    loadAccounts();
    if (id) {
      loadTransaction();
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

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
      // Set default account (first account, usually Cash) only if not editing
      if (data.length > 0 && !formData.accountId && !id) {
        setFormData((prev) => ({ ...prev, accountId: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      const transaction = await apiService.getTransaction(id!);
      setFormData({
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.split('T')[0],
        transactionType: transaction.transactionType,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        paymentMethod: transaction.paymentMethod,
        notes: transaction.notes || '',
      });
    } catch (error) {
      console.error('Error loading transaction:', error);
    }
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod
    const validationResult = transactionSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      
      // Show first error in alert
      const firstError = validationResult.error.issues[0];
      Alert.alert('Validation Error', firstError.message);
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await apiService.updateTransaction(id, formData);
      } else {
        await apiService.createTransaction(formData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const isCredit = formData.transactionType === TransactionType.CREDIT;
  const primaryColor = isCredit ? '#10b981' : '#ef4444';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transaction Type *</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  !isCredit && styles.typeButtonActive,
                  !isCredit && { backgroundColor: '#ef4444' },
                ]}
                onPress={() => setFormData({ ...formData, transactionType: TransactionType.DEBIT })}
              >
                <Text style={[styles.typeButtonText, !isCredit && styles.typeButtonTextActive]}>
                  Expense (Debit)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  isCredit && styles.typeButtonActive,
                  isCredit && { backgroundColor: '#10b981' },
                ]}
                onPress={() => setFormData({ ...formData, transactionType: TransactionType.CREDIT })}
              >
                <Text style={[styles.typeButtonText, isCredit && styles.typeButtonTextActive]}>
                  Income (Credit)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountChip,
                    formData.accountId === account.id && styles.accountChipActive,
                    formData.accountId === account.id && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, accountId: account.id });
                    setErrors({ ...errors, accountId: '' });
                  }}
                >
                  <Text
                    style={[
                      styles.accountChipText,
                      formData.accountId === account.id && styles.accountChipTextActive,
                    ]}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.accountId && <Text style={styles.errorText}>{errors.accountId}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              placeholder="0.00"
              value={formData.amount > 0 ? formData.amount.toString() : ''}
              onChangeText={(text) => {
                const amount = parseFloat(text) || 0;
                setFormData({ ...formData, amount });
                if (errors.amount) {
                  setErrors({ ...errors, amount: '' });
                }
              }}
              keyboardType="decimal-pad"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              placeholder={isCredit ? "What is the source of income?" : "What did you spend on?"}
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {format(new Date(formData.date), 'MMM dd, yyyy')}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                  }
                  if (Platform.OS === 'ios') {
                    setShowDatePicker(false);
                  }
                }}
              />
            )}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                  }
                }}
              />
            )}
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
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
                    formData.paymentMethod === method && { backgroundColor: primaryColor },
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
          style={[styles.saveButton, { backgroundColor: primaryColor }, saving && styles.saveButtonDisabled]}
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
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
    borderColor: 'transparent',
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
  accountScroll: {
    marginTop: 8,
  },
  accountChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  accountChipActive: {
    borderColor: 'transparent',
  },
  accountChipText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  accountChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
});

