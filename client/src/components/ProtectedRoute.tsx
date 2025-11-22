import { useEffect } from 'react';
import { Redirect, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // User is not authenticated, will be redirected
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return null; // Or a loading screen
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}

