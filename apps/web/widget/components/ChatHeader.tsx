'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatState, Room } from '../types';

interface ChatHeaderProps {
  isDark: boolean;
  isConnected: boolean;
  currentRoom: Room | null;
  chatState: ChatState;
  selectedHistoryRoom: any;
  canCreateNewRoom: boolean;
  isTyping: boolean;
  onViewHistory: () => void;
  onBackToHistory: () => void;
  onCreateNewRoom: () => void;
  onClose: () => void;
}

export function ChatHeader({
  isDark,
  isConnected,
  currentRoom,
  chatState,
  selectedHistoryRoom,
  canCreateNewRoom,
  isTyping,
  onViewHistory,
  onBackToHistory,
  onCreateNewRoom,
  onClose
}: ChatHeaderProps) {
  const getRoomStatusDisplay = () => {
    if (!currentRoom) return 'Starting chat...';
    
    const connectionStatus = isConnected ? 'Connected' : 'Connecting...';
    
    switch (currentRoom.status) {
      case 'waiting':
        return `Waiting for agent... (${connectionStatus})`;
      case 'active':
        return currentRoom.assignedAgentEmail 
          ? `Connected with ${currentRoom.assignedAgentEmail} (${connectionStatus})`
          : `Connected with agent (${connectionStatus})`;
      case 'closed':
        return canCreateNewRoom 
          ? 'Chat closed - You can start a new chat'
          : 'Chat closed';
      default:
        return `Chat active (${connectionStatus})`;
    }
  };

  return (
    <div style={{
      padding: '16px',
      background: isDark 
        ? 'linear-gradient(to right, rgba(30, 64, 175, 0.5), rgba(91, 33, 182, 0.5))'
        : 'linear-gradient(to right, rgba(219, 234, 254, 1), rgba(243, 232, 255, 1))',
      borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', marginRight: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>CS</span>
            </div>
            <span style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '12px',
              height: '12px',
              border: '2px solid white',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444'
            }}></span>
          </div>
          <div>
            <h3 style={{
              fontWeight: '600',
              color: isDark ? 'white' : '#1f2937',
              margin: '0',
              fontSize: '14px'
            }}>
              Chat Support
              {currentRoom && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: isDark ? '#9ca3af' : '#6b7280'
                }}>
                  #{currentRoom.roomId}
                </span>
              )}
            </h3>
            <p style={{
              fontSize: '12px',
              color: isDark ? '#9ca3af' : '#6b7280',
              margin: '0'
            }}>
              {getRoomStatusDisplay()}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {chatState === 'chatting' && (
            <motion.button
              onClick={onViewHistory}
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                flexShrink: '0'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Chat history"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#4b5563' : 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)';
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.button>
          )}
          
          {chatState === 'chatting' && selectedHistoryRoom && (
            <motion.button
              onClick={onBackToHistory}
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                flexShrink: '0'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Back to history"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#4b5563' : 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)';
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          
          {chatState === 'chatting' && currentRoom?.status === 'closed' && canCreateNewRoom && (
            <motion.button
              onClick={onCreateNewRoom}
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: isDark ? '#059669' : '#10b981',
                border: 'none',
                cursor: isTyping ? 'not-allowed' : 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
                opacity: isTyping ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                flexShrink: '0'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Start new chat"
              disabled={isTyping}
              onMouseEnter={(e) => {
                if (!isTyping) {
                  e.currentTarget.style.backgroundColor = isDark ? '#047857' : '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (!isTyping) {
                  e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#10b981';
                }
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </motion.button>
          )}
          
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#9ca3af' : '#6b7280',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              flexShrink: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#4b5563' : 'rgba(255, 255, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#374151' : 'rgba(255, 255, 255, 0.4)';
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 