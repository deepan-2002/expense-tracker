import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { formatCurrency } from '@/src/utils/helpers';

export default function SettingsScreen() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>('');

  useEffect(() => {
    if (user) {
      setOpeningBalance(user.openingBalance?.toString() || '0');
      setOpeningBalanceDate(user.openingBalanceDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
    }
  }, [user]);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleSave = async () => {
    const balance = parseFloat(openingBalance) || 0;
    
    setSaving(true);
    try {
      await apiService.updateOpeningBalance(balance, openingBalanceDate);
      await refreshUser();
      Alert.alert('Success', 'Opening balance updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update opening balance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Balance</Text>
          <Text style={styles.sectionDescription}>
            Set your starting balance. This will be used to calculate your current balance.
            Balance = Opening Balance + Total Income - Total Expenses
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Balance Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={openingBalance}
              onChangeText={setOpeningBalance}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Balance Date</Text>
            <TextInput
              style={styles.input}
              value={openingBalanceDate}
              onChangeText={setOpeningBalanceDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.helperText}>
              The date from which this opening balance applies
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Opening Balance'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
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
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
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

