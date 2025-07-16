'use client';

import React from 'react';
import { Room } from '../types';

interface MessageInputProps {
  isDark: boolean;
  inputValue: string;
  currentRoom: Room | null;
  error: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageInput({
  isDark,
  inputValue,
  currentRoom,
  error,
  onInputChange,
  onSubmit
}: MessageInputProps) {
  return (
    <div style={{
      padding: '16px',
      borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      backgroundColor: isDark ? '#1f2937' : '#ffffff'
    }}>
      {error && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '12px',
          marginBottom: '12px'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ 
        display: 'flex', 
        gap: '0',
        alignItems: 'stretch',
        width: '100%'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          disabled={currentRoom?.status === 'closed'}
          style={{
            flex: '1',
            padding: '12px 16px',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            borderRadius: '24px 0 0 24px',
            fontSize: '14px',
            backgroundColor: isDark ? '#374151' : 'white',
            color: isDark ? 'white' : '#1f2937',
            outline: 'none',
            borderRight: 'none',
            minWidth: '0',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            const button = e.target.nextElementSibling as HTMLButtonElement;
            if (button) {
              button.style.borderColor = '#3b82f6';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = isDark ? '#4b5563' : '#d1d5db';
            const button = e.target.nextElementSibling as HTMLButtonElement;
            if (button) {
              button.style.borderColor = isDark ? '#4b5563' : '#d1d5db';
            }
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || currentRoom?.status === 'closed'}
          style={{
            padding: '12px 16px',
            background: !inputValue.trim() || currentRoom?.status === 'closed' 
              ? (isDark ? '#4b5563' : '#d1d5db')
              : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            color: 'white',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            borderRadius: '0 24px 24px 0',
            cursor: !inputValue.trim() || currentRoom?.status === 'closed' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            borderLeft: 'none',
            flexShrink: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            if (inputValue.trim() && currentRoom?.status !== 'closed') {
              e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #7c3aed)';
            }
          }}
          onMouseLeave={(e) => {
            if (inputValue.trim() && currentRoom?.status !== 'closed') {
              e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
            }
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
} 