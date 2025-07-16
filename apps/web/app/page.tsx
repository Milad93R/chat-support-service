'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === 'dark';
  
  return (
    <main className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chat Support Service
          </h1>
          <p className={`text-xl md:text-2xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Get help from our support agents and administrators
          </p>
          <p className={`text-lg mb-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Click the chat button in the bottom right to start a conversation
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
