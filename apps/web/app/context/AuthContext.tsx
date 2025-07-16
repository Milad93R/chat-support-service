'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isGoogleUser: boolean;
  picture?: string;
  role?: 'USER' | 'ADMIN';
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  signUp: (userData: SignUpData) => Promise<void>;
  getAuthToken: () => string | null;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  tradingExperience?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const checkUserAuth = async () => {
      let token = localStorage.getItem('accessToken');
      
      // If no regular token, check for persistent auth
      if (!token) {
        const persistentAuth = localStorage.getItem('persistentAuth');
        if (persistentAuth) {
          try {
            const tokenData = JSON.parse(persistentAuth);
            const expirationDate = new Date(tokenData.expiration);
            
            // Check if persistent token is still valid
            if (new Date() < expirationDate && tokenData.rememberMe) {
              token = tokenData.token;
              // Restore the regular token for this session
              if (token) {
              localStorage.setItem('accessToken', token);
              }
            } else {
              // Persistent token expired, remove it
              localStorage.removeItem('persistentAuth');
            }
          } catch (error) {
            console.error('Error parsing persistent auth:', error);
            localStorage.removeItem('persistentAuth');
          }
        }
      }
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Handle the backend response format
          let user = userData;
          if (userData.user) {
            // If the response has a nested user object, use that
            user = userData.user;
          }
          
          // Map userId to id if needed for frontend compatibility
          if (user.userId && !user.id) {
            user.id = user.userId;
          }
          
          setUser(user);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserAuth();
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const handleOAuthCallback = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = hashParams.get('token');
      
      if (token) {
        localStorage.setItem('accessToken', token);
        router.push('/');
      }
    };
    
    if (typeof window !== 'undefined') {
      handleOAuthCallback();
    }
  }, [router]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if the error is about email verification
        if (data.message === 'Please verify your email first') {
          console.log('Email verification required for:', email);
          
          // Store email in localStorage for the verification page
          localStorage.setItem('pendingVerificationEmail', email);
          
          // Verify it was stored
          const storedEmail = localStorage.getItem('pendingVerificationEmail');
          console.log('Stored email for verification:', { original: email, stored: storedEmail });
          
          // Use setTimeout to ensure localStorage is committed before navigation
          setTimeout(() => {
            console.log('Redirecting to verify-email page');
            router.push('/verify-email');
          }, 100);
          return;
        }
        throw new Error(data.message || 'Authentication failed');
      }
      
      localStorage.setItem('accessToken', data.access_token);
      
      // If remember me is checked, also store in a more persistent way
      if (rememberMe) {
        // Store with longer expiration (30 days)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        const tokenData = {
          token: data.access_token,
          expiration: expirationDate.toISOString(),
          rememberMe: true
        };
        
        localStorage.setItem('persistentAuth', JSON.stringify(tokenData));
      } else {
        // Remove any existing persistent auth if remember me is not checked
        localStorage.removeItem('persistentAuth');
      }
      
      // Save or remove email based on remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Get user profile
      const profileResponse = await fetch(`/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        
        // Handle the backend response format
        let user = userData;
        if (userData.user) {
          // If the response has a nested user object, use that
          user = userData.user;
        }
        
        // Map userId to id if needed for frontend compatibility
        if (user.userId && !user.id) {
          user.id = user.userId;
        }
        
        setUser(user);
      }
      
      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('persistentAuth');
    localStorage.removeItem('rememberedEmail');
    setUser(null);
    router.push('/login');
  };

  const signUp = async (userData: SignUpData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      signUp,
      getAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 