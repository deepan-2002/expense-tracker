import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { RegisterDto } from '@/src/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterDto>({
    email: '',
    password: '',
    name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const dynamicStyles = getStyles(theme);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading]);

  if (!authLoading && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      Alert.alert('Success', 'Account created successfully! Please login to continue.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={dynamicStyles.container}>
      <Header title="Spendly" subtitle="Sign up to get started" />
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.content}>

          <View style={dynamicStyles.form}>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={dynamicStyles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={dynamicStyles.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={dynamicStyles.input}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[dynamicStyles.button, loading && dynamicStyles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={dynamicStyles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <View style={dynamicStyles.linkContainer}>
              <Text style={dynamicStyles.linkText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={dynamicStyles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ThemedView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  form: {
    gap: 16,
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
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkText: {
    color: theme.colors.textSecondary,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

