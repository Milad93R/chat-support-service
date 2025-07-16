'use client';

import React from 'react';
import { Message, Room } from '../types';

interface MessageDisplayProps {
  isDark: boolean;
  messages: Message[];
  currentRoom: Room | null;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageDisplay({
  isDark,
  messages,
  currentRoom,
  isTyping,
  messagesEndRef
}: MessageDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      height: '320px',
      overflowY: 'auto',
      padding: '16px',
      backgroundColor: isDark ? '#111827' : '#f9fafb'
    }}
    className={`chat-widget-scroll ${isDark ? 'chat-widget-scroll-dark' : ''}`}
    >
      {messages.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h3 style={{
            color: isDark ? 'white' : '#1f2937',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Welcome to Chat Support
          </h3>
          <p style={{
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
            margin: '0'
          }}>
            {currentRoom?.status === 'waiting' 
              ? 'Please wait while we connect you with an agent...'
              : 'Start a conversation with our support team'
            }
          </p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.messageId} style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: message.sender === 'client' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: message.sender === 'client' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: message.sender === 'client' 
                  ? (isDark ? '#3b82f6' : '#3b82f6')
                  : (isDark ? '#374151' : '#e5e7eb'),
                color: message.sender === 'client' 
                  ? 'white' 
                  : (isDark ? 'white' : '#1f2937'),
                fontSize: '14px',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                <div>{message.content}</div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  marginTop: '4px',
                  textAlign: message.sender === 'client' ? 'right' : 'left'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? 'white' : '#1f2937',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Agent is typing</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          animation: `bounce 1.4s infinite ease-in-out`,
                          animationDelay: `${i * 0.16}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
} 