'use client';

import React from 'react';
import { Room } from '../types';

interface ChatFooterProps {
  isDark: boolean;
  isConnected: boolean;
  currentRoom: Room | null;
}

export function ChatFooter({ isDark, isConnected, currentRoom }: ChatFooterProps) {
  return (
    <div style={{
      padding: '8px 12px',
      textAlign: 'center',
      fontSize: '12px',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      color: isDark ? '#6b7280' : '#6b7280'
    }}>
      <p style={{ margin: '0' }}>
        Powered by Chat Support
        {currentRoom && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '8px' }}>
            <svg style={{ width: '12px', height: '12px', marginRight: '4px', color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Room: {currentRoom.roomId}
          </span>
        )}
        {isConnected && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '8px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '4px' }}></span>
            Live
          </span>
        )}
      </p>
    </div>
  );
} 