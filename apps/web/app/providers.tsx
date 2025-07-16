'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './context/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
} 