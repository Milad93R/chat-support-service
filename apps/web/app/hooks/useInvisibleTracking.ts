import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export const useInvisibleTracking = () => {
  // Rate limiting to prevent duplicate notifications
  const lastNotificationTime = useRef<{ [key: string]: number }>({});
  const pathname = usePathname();
  
  const sendInvisibleNotification = useCallback(async (action: 'visit' | 'signup' | 'signin' | 'dashboard' | 'custom', customPage?: string) => {
    try {
      // Rate limiting: prevent duplicate notifications within 30 seconds
      const now = Date.now();
      const rateKey = `${action}-${pathname}`;
      const lastTime = lastNotificationTime.current[rateKey] || 0;
      if (now - lastTime < 30000) { // 30 seconds
        return;
      }
      lastNotificationTime.current[rateKey] = now;

      // Determine page name from pathname
      const getPageName = (path: string) => {
        if (path === '/') return 'Landing Page';
        if (path.startsWith('/dashboard')) return 'Dashboard';
        if (path.startsWith('/signin')) return 'Sign In';
        if (path.startsWith('/signup')) return 'Sign Up';
        if (path.startsWith('/forgot-password')) return 'Forgot Password';
        if (path.startsWith('/reset-password')) return 'Reset Password';
        if (path.startsWith('/verify-email')) return 'Email Verification';
        if (path.startsWith('/auth-success')) return 'Auth Success';
        return path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page';
      };

      const pageName = customPage || getPageName(pathname);

      // Send to our invisible page-view endpoint (disguised as analytics)
      const response = await fetch('/api/page-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add headers that make it look like normal analytics
          'X-Requested-With': 'XMLHttpRequest',
          'X-Analytics-Type': 'page-view',
        },
        body: JSON.stringify({
          action,
          page: pageName,
          // Add fake analytics data to disguise the request
          timestamp: Date.now(),
          session: Math.random().toString(36).substring(7),
          referrer: document.referrer || 'direct',
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          screen: `${screen.width}x${screen.height}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      await response.json();
    } catch (error) {
      // Silent error handling - no logs, no traces
    }
  }, [pathname]);

  const trackVisit = useCallback((customPage?: string) => {
    sendInvisibleNotification('visit', customPage);
  }, [sendInvisibleNotification]);

  const trackSignup = useCallback(() => {
    sendInvisibleNotification('signup');
  }, [sendInvisibleNotification]);

  const trackSignin = useCallback(() => {
    sendInvisibleNotification('signin');
  }, [sendInvisibleNotification]);

  const trackDashboard = useCallback(() => {
    sendInvisibleNotification('dashboard');
  }, [sendInvisibleNotification]);

  const trackCustomAction = useCallback((action: 'custom', pageName: string) => {
    sendInvisibleNotification(action, pageName);
  }, [sendInvisibleNotification]);

  // Track page visit on mount (only for main pages)
  useEffect(() => {
    // Only track visits on main pages, not API routes or internal pages
    const shouldTrack = pathname === '/' || 
                       pathname.startsWith('/dashboard') ||
                       pathname.startsWith('/signin') ||
                       pathname.startsWith('/signup');

    if (shouldTrack) {
      // Add a small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        trackVisit();
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }
  }, [trackVisit, pathname]);

  return {
    trackVisit,
    trackSignup,
    trackSignin,
    trackDashboard,
    trackCustomAction,
  };
}; 