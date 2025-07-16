'use client';

import React from 'react';

interface LoadingSpinnerProps {
  isDark: boolean;
  message?: string;
}

export function LoadingSpinner({ isDark, message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      height: '320px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#111827' : '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `3px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          margin: '0'
        }}>
          {message}
        </p>
      </div>
    </div>
  );
} 