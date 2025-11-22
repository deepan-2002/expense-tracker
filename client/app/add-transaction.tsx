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
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedView } from '@/components/themed-view';

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
  const theme = useAppTheme();
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

  const dynamicStyles = getStyles(theme);

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
  const primaryColor = isCredit ? theme.colors.success : theme.colors.error;

  return (
    <ThemedView style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.scrollView}>
        <View style={dynamicStyles.form}>
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Transaction Type *</Text>
            <View style={dynamicStyles.typeContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.typeButton,
                  !isCredit && dynamicStyles.typeButtonActive,
                  !isCredit && { backgroundColor: theme.colors.error },
                ]}
                onPress={() => setFormData({ ...formData, transactionType: TransactionType.DEBIT })}
              >
                <Text style={[dynamicStyles.typeButtonText, !isCredit && dynamicStyles.typeButtonTextActive]}>
                  Expense (Debit)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.typeButton,
                  isCredit && dynamicStyles.typeButtonActive,
                  isCredit && { backgroundColor: theme.colors.success },
                ]}
                onPress={() => setFormData({ ...formData, transactionType: TransactionType.CREDIT })}
              >
                <Text style={[dynamicStyles.typeButtonText, isCredit && dynamicStyles.typeButtonTextActive]}>
                  Income (Credit)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Account *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.accountScroll}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    dynamicStyles.accountChip,
                    formData.accountId === account.id && dynamicStyles.accountChipActive,
                    formData.accountId === account.id && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, accountId: account.id });
                    setErrors({ ...errors, accountId: '' });
                  }}
                >
                  <Text
                    style={[
                      dynamicStyles.accountChipText,
                      formData.accountId === account.id && dynamicStyles.accountChipTextActive,
                    ]}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.accountId && <Text style={dynamicStyles.errorText}>{errors.accountId}</Text>}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Amount *</Text>
            <TextInput
              style={[dynamicStyles.input, errors.amount && dynamicStyles.inputError]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
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
            {errors.amount && <Text style={dynamicStyles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Description *</Text>
            <TextInput
              style={[dynamicStyles.input, errors.description && dynamicStyles.inputError]}
              placeholder={isCredit ? "What is the source of income?" : "What did you spend on?"}
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
            />
            {errors.description && <Text style={dynamicStyles.errorText}>{errors.description}</Text>}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Date *</Text>
            <TouchableOpacity
              style={dynamicStyles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={dynamicStyles.dateButtonText}>
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
            {errors.date && <Text style={dynamicStyles.errorText}>{errors.date}</Text>}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    dynamicStyles.categoryChip,
                    formData.categoryId === category.id && dynamicStyles.categoryChipActive,
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
                  <Text style={dynamicStyles.categoryChipText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Payment Method</Text>
            <View style={dynamicStyles.paymentMethodContainer}>
              {Object.values(PaymentMethod).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    dynamicStyles.paymentMethodButton,
                    formData.paymentMethod === method && dynamicStyles.paymentMethodButtonActive,
                    formData.paymentMethod === method && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => setFormData({ ...formData, paymentMethod: method })}
                >
                  <Text
                    style={[
                      dynamicStyles.paymentMethodText,
                      formData.paymentMethod === method && dynamicStyles.paymentMethodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Notes (Optional)</Text>
            <TextInput
              style={[dynamicStyles.input, dynamicStyles.textArea]}
              placeholder="Add any additional notes..."
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <TouchableOpacity
          style={[dynamicStyles.saveButton, { backgroundColor: primaryColor }, saving && dynamicStyles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={dynamicStyles.saveButtonText}>
            {saving ? 'Saving...' : id ? 'Update' : 'Save'}
          </Text>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.cardBackground,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.secondaryBackground,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardBackground,
  },
  paymentMethodButtonActive: {
    borderColor: 'transparent',
  },
  paymentMethodText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    borderColor: theme.colors.border,
    marginRight: 8,
    backgroundColor: theme.colors.cardBackground,
  },
  accountChipActive: {
    borderColor: 'transparent',
  },
  accountChipText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  accountChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.cardBackground,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
});

