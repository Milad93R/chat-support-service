import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ChatWidgetSelector from './components/ChatWidgetSelector';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat support',
  description: 'Chat support',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ChatWidgetSelector />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
