import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Account, AccountType, CreateAccountDto, BalanceResponse } from '@/src/types';
import { formatCurrency } from '@/src/utils/helpers';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Header } from '@/components/header';

export default function AccountsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, BalanceResponse>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<CreateAccountDto>({
    name: '',
    type: AccountType.CASH,
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const dynamicStyles = getStyles(theme);

  const loadData = async () => {
    try {
      const [accountsData, balancesData] = await Promise.all([
        apiService.getAccounts(),
        apiService.getAllBalances(),
      ]);
      setAccounts(accountsData);
      const balancesMap: Record<string, BalanceResponse> = {};
      balancesData.forEach((balance) => {
        balancesMap[balance.accountId] = balance;
      });
      setBalances(balancesMap);
    } catch (error) {
      console.error('Error loading accounts:', error);
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

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setSaving(true);
    try {
      await apiService.createAccount(formData);
      setShowModal(false);
      setFormData({
        name: '',
        type: AccountType.CASH,
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    const balance = account ? balances[account.id] : null;
    const hasTransactions = balance 
      ? (balance.totalCredit > 0 || balance.totalDebit > 0)
      : false;
    
    if (hasTransactions) {
      Alert.alert(
        'Cannot Delete Account',
        'This account has transactions. Please delete or move the transactions before deleting the account.',
      );
      return;
    }
    
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAccount(accountId);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case AccountType.CASH:
        return 'Cash';
      case AccountType.BANK:
        return 'Bank';
      case AccountType.CARD:
        return 'Card';
      case AccountType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <ThemedView style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Text style={dynamicStyles.addButtonText}>+ Add Account</Text>
          </TouchableOpacity>
        </View>

        {loading && accounts.length === 0 ? (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>Loading accounts...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>No accounts found</Text>
            <Text style={[dynamicStyles.emptyText, { fontSize: 14, marginTop: 8 }]}>
              Create your first account to get started
            </Text>
          </View>
        ) : (
          accounts.map((account, index) => {
            const balance = balances[account.id];
            // Check if this is the default Cash account (first account, named "Cash", type CASH)
            const isDefaultCashAccount = 
              index === 0 && 
              account.name.toLowerCase() === 'cash' && 
              account.type === AccountType.CASH;
            
            // Check if account has transactions
            const hasTransactions = balance 
              ? (balance.totalCredit > 0 || balance.totalDebit > 0)
              : false;
            
            const canDelete = !isDefaultCashAccount && !hasTransactions;
            
            return (
              <TouchableOpacity
                key={account.id}
                style={dynamicStyles.accountCard}
                onPress={() => router.push(`/(tabs)/expenses?accountId=${account.id}`)}
              >
                <View style={dynamicStyles.accountHeader}>
                  <View>
                    <Text style={dynamicStyles.accountName}>{account.name}</Text>
                    <Text style={dynamicStyles.accountType}>{getAccountTypeLabel(account.type)}</Text>
                    {isDefaultCashAccount && (
                      <Text style={dynamicStyles.defaultBadge}>Default Account</Text>
                    )}
                  </View>
                  <Text style={dynamicStyles.accountBalance}>
                    {balance ? formatCurrency(balance.balance) : '₹0.00'}
                  </Text>
                </View>
                {balance && (
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
                )}
                {canDelete ? (
                  <TouchableOpacity
                    style={dynamicStyles.deleteButton}
                    onPress={() => handleDeleteAccount(account.id)}
                  >
                    <Text style={dynamicStyles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={dynamicStyles.deleteButton}>
                    <Text style={dynamicStyles.cannotDeleteText}>
                      {isDefaultCashAccount 
                        ? 'Default account cannot be deleted' 
                        : 'Account with transactions cannot be deleted'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Create New Account</Text>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Account Name *</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., Savings Account"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Account Type *</Text>
              <View style={dynamicStyles.typeContainer}>
                {Object.values(AccountType).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      dynamicStyles.typeButton,
                      formData.type === type && dynamicStyles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type })}
                  >
                    <Text
                      style={[
                        dynamicStyles.typeButtonText,
                        formData.type === type && dynamicStyles.typeButtonTextActive,
                      ]}
                    >
                      {getAccountTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Opening Balance</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="0.00"
                value={(formData.openingBalance ?? 0) > 0 ? (formData.openingBalance ?? 0).toString() : ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, openingBalance: parseFloat(text) || 0 })
                }
                keyboardType="decimal-pad"
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Opening Balance Date</Text>
              <TouchableOpacity
                style={dynamicStyles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={dynamicStyles.dateButtonText}>
                  {format(new Date(formData.openingBalanceDate || new Date()), 'MMM dd, yyyy')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(formData.openingBalanceDate || new Date())}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setFormData({ ...formData, openingBalanceDate: date.toISOString().split('T')[0] });
                    }
                  }}
                />
              )}
            </View>

            <View style={dynamicStyles.modalActions}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.saveButton]}
                onPress={handleCreateAccount}
                disabled={saving}
              >
                <Text style={dynamicStyles.saveButtonText}>
                  {saving ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    accountCard: {
      backgroundColor: theme.colors.cardBackground,
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
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
    accountType: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    accountBalance: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    accountDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginBottom: 12,
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
    deleteButton: {
      marginTop: 8,
      paddingVertical: 8,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: theme.colors.error,
      fontSize: 14,
      fontWeight: '600',
    },
    cannotDeleteText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    defaultBadge: {
      fontSize: 11,
      color: theme.colors.primary,
      marginTop: 4,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.colors.secondaryBackground,
      color: theme.colors.text,
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondaryBackground,
    },
    typeButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    typeButtonText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    typeButtonTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    dateButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.colors.secondaryBackground,
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: theme.colors.secondaryBackground,
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

