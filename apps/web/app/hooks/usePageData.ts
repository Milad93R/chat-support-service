import { useState, useEffect } from 'react';

interface UsePageDataOptions {
  endpoint: string;
  dependencies?: any[];
  requireAuth?: boolean;
}

interface PageDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePageData<T = any>({ endpoint, dependencies = [], requireAuth = false }: UsePageDataOptions): PageDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if required
      if (requireAuth) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          throw new Error('Authentication required but no token found');
        }
      }
      
      const response = await fetch(endpoint, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Page data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, ...dependencies]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Specific hooks for different pages
export const useDashboardData = () => usePageData({ endpoint: '/api/dashboard', requireAuth: true });
export const useStrategyData = () => usePageData({ endpoint: '/api/dashboard/strategy', requireAuth: true });
export const useProfileData = () => usePageData({ endpoint: '/api/dashboard/profile', requireAuth: true });
export const usePerformanceData = () => usePageData({ endpoint: '/api/dashboard/performance', requireAuth: true });
export const useSettingsData = () => usePageData({ endpoint: '/api/dashboard/settings', requireAuth: true });
export const useSupportData = () => usePageData({ endpoint: '/api/dashboard/support', requireAuth: true });
export const useSigninData = () => usePageData({ endpoint: '/api/auth/signin' });
export const useSignupData = () => usePageData({ endpoint: '/api/auth/signup' });
export const useLandingData = () => usePageData({ endpoint: '/api/landing' }); 