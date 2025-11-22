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
import { useTheme, ThemeMode } from '@/src/context/ThemeContext';
import { apiService } from '@/src/services/api';
import { formatCurrency } from '@/src/utils/helpers';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';

export default function SettingsScreen() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const theme = useAppTheme();
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

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const dynamicStyles = getStyles(theme);

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Settings" />
      <ScrollView style={dynamicStyles.scrollView}>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Appearance</Text>
          <Text style={dynamicStyles.sectionDescription}>
            Choose your preferred theme mode
          </Text>

          <View style={dynamicStyles.themeSelector}>
            <TouchableOpacity
              style={[
                dynamicStyles.themeOption,
                themeMode === 'light' && dynamicStyles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text style={[
                dynamicStyles.themeOptionText,
                themeMode === 'light' && dynamicStyles.themeOptionTextActive,
              ]}>
                Light Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.themeOption,
                themeMode === 'dark' && dynamicStyles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text style={[
                dynamicStyles.themeOptionText,
                themeMode === 'dark' && dynamicStyles.themeOptionTextActive,
              ]}>
                Dark Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.themeOption,
                themeMode === 'system' && dynamicStyles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Text style={[
                dynamicStyles.themeOptionText,
                themeMode === 'system' && dynamicStyles.themeOptionTextActive,
              ]}>
                System Default
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Opening Balance</Text>
          <Text style={dynamicStyles.sectionDescription}>
            Set your starting balance. This will be used to calculate your current balance.
            Balance = Opening Balance + Total Income - Total Expenses
          </Text>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Opening Balance Amount *</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              value={openingBalance}
              onChangeText={setOpeningBalance}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Opening Balance Date</Text>
            <TextInput
              style={dynamicStyles.input}
              value={openingBalanceDate}
              onChangeText={setOpeningBalanceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={dynamicStyles.helperText}>
              The date from which this opening balance applies
            </Text>
          </View>

          <TouchableOpacity
            style={[dynamicStyles.saveButton, saving && dynamicStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={dynamicStyles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Opening Balance'}
            </Text>
          </TouchableOpacity>
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
  section: {
    padding: 20,
    backgroundColor: theme.colors.cardBackground,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.secondaryBackground,
    alignItems: 'center',
  },
  themeOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  themeOptionTextActive: {
    color: '#fff',
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
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

