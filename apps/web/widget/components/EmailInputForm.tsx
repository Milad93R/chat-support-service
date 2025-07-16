'use client';

import React from 'react';

interface EmailInputFormProps {
  isDark: boolean;
  clientEmail: string;
  clientName: string;
  error: string;
  isTyping: boolean;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmailInputForm({
  isDark,
  clientEmail,
  clientName,
  error,
  isTyping,
  onEmailChange,
  onNameChange,
  onSubmit
}: EmailInputFormProps) {
  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{
        color: isDark ? 'white' : '#1f2937',
        marginBottom: '16px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Start a conversation
      </h3>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: isDark ? '#d1d5db' : '#374151',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Email Address *
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: isDark ? '#374151' : 'white',
              color: isDark ? 'white' : '#1f2937',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDark ? '#4b5563' : '#d1d5db';
            }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: isDark ? '#d1d5db' : '#374151',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Name (Optional)
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: isDark ? '#374151' : 'white',
              color: isDark ? 'white' : '#1f2937',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDark ? '#4b5563' : '#d1d5db';
            }}
          />
        </div>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isTyping}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isTyping ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isTyping ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isTyping) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTyping) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }
          }}
        >
          {isTyping ? 'Starting chat...' : 'Start Chat'}
        </button>
      </form>
    </div>
  );
} 