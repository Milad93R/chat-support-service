'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './contexts';
import { useWebSocket } from './hooks';
import { 
  ChatToggleButton, 
  ChatHeader, 
  EmailInputForm, 
  MessageDisplay, 
  MessageInput, 
  ChatHistory, 
  LoadingSpinner, 
  ChatFooter 
} from './components';
import { getWidgetConfig } from './config';
import { ChatState, Message, Room, ChatRoom } from './types';

// Add CSS animation styles
function addGlobalStyles() {
  if (typeof document === 'undefined') return;
  
  const existingStyle = document.getElementById('chat-widget-styles');
  if (existingStyle) return;

  const style = document.createElement('style');
  style.id = 'chat-widget-styles';
  style.textContent = `
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Modern scrollbar styles */
    .chat-widget-scroll::-webkit-scrollbar {
      width: 6px;
    }
    
    .chat-widget-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .chat-widget-scroll::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 3px;
      transition: background 0.2s ease;
    }
    
    .chat-widget-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.6);
    }
    
    .chat-widget-scroll-dark::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.6);
    }
    
    .chat-widget-scroll-dark::-webkit-scrollbar-thumb:hover {
      background: rgba(75, 85, 99, 0.8);
    }
    
    /* Firefox scrollbar */
    .chat-widget-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
    }
    
    .chat-widget-scroll-dark {
      scrollbar-color: rgba(75, 85, 99, 0.6) transparent;
    }
  `;
  document.head.appendChild(style);
}

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState<ChatState>('email-input');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [canCreateNewRoom, setCanCreateNewRoom] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatRoom[]>([]);
  const [selectedHistoryRoom, setSelectedHistoryRoom] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Add global styles
  useEffect(() => {
    addGlobalStyles();
  }, []);

  const {
    isConnected,
    joinRoom,
    sendMessage: wsSendMessage,
    markMessagesAsRead,
    on,
    off,
  } = useWebSocket();

  const CLIENT_EMAIL_KEY = 'chat_client_email';
  const CLIENT_NAME_KEY = 'chat_client_name';
  const ROOM_ID_KEY = 'chat_room_id';

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const saveClientData = (email: string, name: string, roomId?: string) => {
    localStorage.setItem(CLIENT_EMAIL_KEY, email);
    localStorage.setItem(CLIENT_NAME_KEY, name);
    if (roomId) {
      localStorage.setItem(ROOM_ID_KEY, roomId);
    }
  };

  const loadClientData = () => {
    const email = localStorage.getItem(CLIENT_EMAIL_KEY);
    const name = localStorage.getItem(CLIENT_NAME_KEY);
    const roomId = localStorage.getItem(ROOM_ID_KEY);
    
    if (email) {
      return { email, name: name || '', roomId: roomId || null };
    }
    return null;
  };

  const clearRoomData = () => {
    localStorage.removeItem(ROOM_ID_KEY);
    setCurrentRoom(null);
    setMessages([]);
    setChatState('email-input');
  };

  // Auto-scroll effects
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatState === 'chatting') {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatState]);

  useEffect(() => {
    if (isOpen && chatState === 'chatting' && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, chatState, messages.length]);

  // WebSocket event handlers
  useEffect(() => {
    const handleNewMessage = (data: { message: Message; room: Room }) => {
      const newMessage = {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      if (data.message.sender === 'agent' && !isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleRoomStatusChanged = (data: { roomId: string; status: string; assignedAgentEmail?: string }) => {
      if (currentRoom && currentRoom.roomId === data.roomId) {
        setCurrentRoom(prev => prev ? {
          ...prev,
          status: data.status as 'active' | 'waiting' | 'closed',
          assignedAgentEmail: data.assignedAgentEmail
        } : null);
      }
    };

    on('new-message', handleNewMessage);
    on('room-status-changed', handleRoomStatusChanged);

    return () => {
      off('new-message');
      off('room-status-changed');
    };
  }, [on, off, currentRoom, isOpen]);

  // Join room when connected
  useEffect(() => {
    if (isOpen && isConnected && currentRoom && currentRoom.roomId) {
      joinRoom(currentRoom.roomId, clientEmail, 'client');
    }
  }, [isOpen, isConnected, currentRoom, clientEmail, joinRoom]);

  // Mark messages as read when opened
  useEffect(() => {
    if (isOpen && currentRoom && clientEmail && isConnected) {
      markMessagesAsRead(currentRoom.roomId, clientEmail, 'client');
    }
  }, [isOpen, currentRoom, clientEmail, isConnected, markMessagesAsRead]);

  // Load client data on mount
  useEffect(() => {
    const clientData = loadClientData();
    if (clientData) {
      setClientEmail(clientData.email);
      setClientName(clientData.name || '');
      
      checkCanCreateNewRoom(clientData.email);
      
      if (clientData.roomId) {
        loadExistingRoom(clientData.roomId);
      } else {
        checkForRecentRoom(clientData.email);
      }
    }
  }, []);

  const checkCanCreateNewRoom = async (email: string) => {
    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms/client/${encodeURIComponent(email)}?recent=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCanCreateNewRoom(data.data.canCreateNewRoom);
      }
    } catch (error) {
      console.error('Error checking if can create new room:', error);
    }
  };

  const checkForRecentRoom = async (email: string) => {
    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms/client/${encodeURIComponent(email)}?recent=true`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.room) {
        const room = data.data.room;
        setCurrentRoom(room);
        setMessages(room.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []);
        setChatState('chatting');
        setCanCreateNewRoom(data.data.canCreateNewRoom);
        
        saveClientData(email, clientName, room.roomId);
        
        if (room.unreadCountForClient !== undefined) {
          setUnreadCount(room.unreadCountForClient);
        }
      }
    } catch (error) {
      console.error('Error checking for recent room:', error);
    }
  };

  const loadExistingRoom = async (roomId: string) => {
    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms/${roomId}`);
      const data = await response.json();

      const room = data.data || data;
      
      if (room && room.roomId) {
        const clientData = loadClientData();
        
        setCurrentRoom(room);
        setMessages(room.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []);
        setChatState('chatting');
        
        setTimeout(scrollToBottom, 200);
        
        if (room.unreadCountForClient !== undefined) {
          setUnreadCount(room.unreadCountForClient);
        }
        
        if (clientData && clientData.email) {
          saveClientData(clientData.email, clientData.name || '', room.roomId);
        }
      } else {
        setChatState('email-input');
        clearRoomData();
      }
    } catch (error) {
      console.error('Error loading existing room:', error);
      setChatState('email-input');
      clearRoomData();
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim()) return;

    setIsTyping(true);
    setError('');

    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setCurrentRoom(data.data);
        setMessages(data.data.messages || []);
        setChatState('chatting');
        saveClientData(clientEmail.trim(), clientName.trim(), data.data.roomId);
        
        setTimeout(scrollToBottom, 100);
      } else {
        setError(data.message || 'Failed to create chat room');
      }
    } catch (error) {
      setError('Failed to connect to chat service');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentRoom || !clientEmail) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    wsSendMessage(currentRoom.roomId, messageContent, 'client', clientEmail);
  };

  const handleCreateNewRoom = async () => {
    if (!clientEmail || !canCreateNewRoom) return;

    setIsTyping(true);
    setError('');

    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setCurrentRoom(data.data);
        setMessages(data.data.messages || []);
        setChatState('chatting');
        saveClientData(clientEmail.trim(), clientName.trim(), data.data.roomId);
        
        setTimeout(scrollToBottom, 100);
      } else {
        setError(data.message || 'Failed to create new chat room');
      }
    } catch (error) {
      setError('Failed to connect to chat service');
    } finally {
      setIsTyping(false);
    }
  };

  const loadChatHistory = async (email: string) => {
    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms/client/${encodeURIComponent(email)}/history`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const rooms = Array.isArray(data.data) ? data.data : [data.data];
        setChatHistory(rooms);
        return rooms;
      }
      return [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  };

  const handleViewHistory = async () => {
    if (!clientEmail) {
      setError('Please enter your email first');
      return;
    }

    setError('');
    setChatState('loading');

    try {
      const history = await loadChatHistory(clientEmail);
      if (history.length > 0) {
        setChatState('history');
      } else {
        setError('No chat history found');
        setChatState('chatting');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load chat history');
      setChatState('chatting');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSelectHistoryRoom = (room: ChatRoom) => {
    setSelectedHistoryRoom(room);
    setCurrentRoom(room);
    setMessages(room.messages?.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) || []);
    
    setChatState('chatting');
    
    if (room.status !== 'closed') {
      if (isConnected) {
        joinRoom(room.roomId, clientEmail, 'client');
      }
    }
    
    setTimeout(scrollToBottom, 200);
  };

  const handleBackToCurrentChat = async () => {
    if (!clientEmail) {
      setChatState('email-input');
      return;
    }

    try {
      const response = await fetch(`${getWidgetConfig().apiBaseUrl}/chat-rooms/client/${encodeURIComponent(clientEmail)}?recent=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const { room, canCreateNewRoom: canCreate } = data.data;
        setCanCreateNewRoom(canCreate);
        
        if (room) {
          setCurrentRoom(room);
          setMessages(room.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []);
          setChatState('chatting');
          
          if (room.status !== 'closed' && isConnected) {
            joinRoom(room.roomId, clientEmail, 'client');
          }
          
          setTimeout(scrollToBottom, 200);
        } else {
          setChatState('email-input');
        }
      } else {
        setChatState('email-input');
      }
    } catch (error) {
      console.error('Error loading current chat:', error);
      setChatState('email-input');
    }
    
    setSelectedHistoryRoom(null);
  };

  const renderContent = () => {
    switch (chatState) {
      case 'email-input':
        return (
          <EmailInputForm
            isDark={isDark}
            clientEmail={clientEmail}
            clientName={clientName}
            error={error}
            isTyping={isTyping}
            onEmailChange={setClientEmail}
            onNameChange={setClientName}
            onSubmit={handleEmailSubmit}
          />
        );
      case 'loading':
        return <LoadingSpinner isDark={isDark} message="Loading chat history..." />;
      case 'history':
        return (
          <ChatHistory
            isDark={isDark}
            chatHistory={chatHistory}
            onSelectRoom={handleSelectHistoryRoom}
          />
        );
      case 'chatting':
        return (
          <>
            <MessageDisplay
              isDark={isDark}
              messages={messages}
              currentRoom={currentRoom}
              isTyping={isTyping}
              messagesEndRef={messagesEndRef}
            />
            <MessageInput
              isDark={isDark}
              inputValue={inputValue}
              currentRoom={currentRoom}
              error={error}
              onInputChange={setInputValue}
              onSubmit={handleSendMessage}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-widget-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 999999 }}>
      <ChatToggleButton 
        isOpen={isOpen} 
        unreadCount={unreadCount} 
        onToggle={handleToggle} 
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 999999,
              width: '384px',
              pointerEvents: 'auto'
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              backgroundColor: isDark ? '#111827' : '#ffffff'
            }}>
              <ChatHeader
                isDark={isDark}
                isConnected={isConnected}
                currentRoom={currentRoom}
                chatState={chatState}
                selectedHistoryRoom={selectedHistoryRoom}
                canCreateNewRoom={canCreateNewRoom}
                isTyping={isTyping}
                onViewHistory={handleViewHistory}
                onBackToHistory={() => setChatState('history')}
                onCreateNewRoom={handleCreateNewRoom}
                onClose={handleClose}
              />

              {renderContent()}

              <ChatFooter
                isDark={isDark}
                isConnected={isConnected}
                currentRoom={currentRoom}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StandaloneChatWidget() {
  return (
    <ThemeProvider>
      <ChatWidget />
    </ThemeProvider>
  );
}

// Export configuration function for backward compatibility
export { setWidgetConfig } from './config'; 