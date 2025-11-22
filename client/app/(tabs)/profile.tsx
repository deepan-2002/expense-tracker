import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Header } from '@/components/header';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const dynamicStyles = getStyles(theme);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Navigate to login after successful logout
            router.replace('/(auth)/login');
          } catch (error) {
            // Even if logout fails, navigate to login
            // The logout function already clears local storage
            console.error('Logout error:', error);
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  const userName = user?.fullName || user?.name || user?.username || 'User';
  const userEmail = user?.email || '';

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Profile" />
      <ScrollView style={dynamicStyles.scrollView}>
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.avatar}>
            <Text style={dynamicStyles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={dynamicStyles.userName}>{userName}</Text>
          <Text style={dynamicStyles.userEmail}>{userEmail}</Text>
        </View>

        <View style={dynamicStyles.section}>
          <TouchableOpacity
            style={dynamicStyles.menuItem}
            onPress={() => router.push('/categories')}
          >
            <Text style={dynamicStyles.menuItemText}>Categories</Text>
            <Text style={dynamicStyles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

            <View style={dynamicStyles.section}>
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={() => router.push('/accounts')}
              >
                <Text style={dynamicStyles.menuItemText}>Accounts</Text>
                <Text style={dynamicStyles.menuItemArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={() => router.push('/settings')}
              >
                <Text style={dynamicStyles.menuItemText}>Settings</Text>
                <Text style={dynamicStyles.menuItemArrow}>›</Text>
              </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <Text style={dynamicStyles.menuItemText}>About</Text>
            <Text style={dynamicStyles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.section}>
          <TouchableOpacity
            style={[dynamicStyles.menuItem, dynamicStyles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[dynamicStyles.menuItemText, dynamicStyles.logoutText]}>Logout</Text>
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
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  menuItemArrow: {
    fontSize: 20,
    color: theme.colors.textTertiary,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
});

