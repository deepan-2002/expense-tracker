import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginDto, RegisterDto } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (userJson && token) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        // Optionally refresh user data from server
        try {
          const freshUser = await apiService.getProfile();
          setUser(freshUser);
        } catch (error) {
          // If refresh fails, use cached user
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      console.log('AuthContext: Starting login...');
      const response = await apiService.login(credentials);
      // Tokens are already saved in apiService.login()
      console.log('AuthContext: Login response received', { 
        user: response.user, 
        hasTokens: !!response.accessToken,
        userId: response.user?.id 
      });
      
      // Update user state - this will trigger isAuthenticated to become true
      setUser(response.user);
      
      // Verify state was updated
      console.log('AuthContext: User state set, isAuthenticated should update');
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    // Register the user but don't automatically log them in
    // User will need to login separately after registration
    await apiService.register(data);
    // Don't set user - let them login manually
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await apiService.getProfile();
      setUser(freshUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

