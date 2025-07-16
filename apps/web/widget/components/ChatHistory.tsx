'use client';

import React from 'react';
import { ChatRoom } from '../types';

interface ChatHistoryProps {
  isDark: boolean;
  chatHistory: ChatRoom[];
  onSelectRoom: (room: ChatRoom) => void;
}

export function ChatHistory({
  isDark,
  chatHistory,
  onSelectRoom
}: ChatHistoryProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div style={{
      height: '320px',
      overflowY: 'auto',
      backgroundColor: isDark ? '#111827' : '#f9fafb'
    }}
    className={`chat-widget-scroll ${isDark ? 'chat-widget-scroll-dark' : ''}`}
    >
      <div style={{ padding: '16px' }}>
        <h3 style={{
          color: isDark ? 'white' : '#1f2937',
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Chat History
        </h3>
        
        {chatHistory.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No chat history found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatHistory.map((room) => (
              <div
                key={room.roomId}
                onClick={() => onSelectRoom(room)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#1f2937' : 'white',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : 'white';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    #{room.roomId}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: room.status === 'active' ? '#10b981' : 
                                   room.status === 'waiting' ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {room.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#9ca3af' : '#6b7280'
                    }}>
                      {formatDate(new Date(room.lastActivity))}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: isDark ? '#6b7280' : '#9ca3af'
                    }}>
                      {room.messages?.length || 0} messages
                    </div>
                  </div>
                  {room.unreadCountForClient && room.unreadCountForClient > 0 && (
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {room.unreadCountForClient > 9 ? '9+' : room.unreadCountForClient}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 