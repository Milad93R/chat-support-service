'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../hooks/useWebSocket';

type Message = {
  messageId: string;
  content: string;
  sender: 'client' | 'agent';
  senderEmail?: string;
  timestamp: Date;
  isRead: boolean;
};

type ChatRoom = {
  roomId: string;
  clientEmail: string;
  clientName?: string;
  status: 'active' | 'waiting' | 'closed';
  assignedAgent?: string;
  assignedAgentEmail?: string;
  messages: Message[];
  lastActivity: Date;
};

type ChatState = 'email-input' | 'chatting' | 'loading' | 'history';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState<ChatState>('email-input');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
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

  // WebSocket connection
  const {
    isConnected,
    connectionError,
    currentRoom: wsCurrentRoom,
    notificationCounts,
    joinRoom,
    leaveRoom,
    sendMessage: wsSendMessage,
    markMessagesAsRead,
    getNotificationCounts,
    resetNotificationCount,
    on,
    off,
  } = useWebSocket({
    autoConnect: true,
  });

  // LocalStorage keys for client data persistence
  const CLIENT_EMAIL_KEY = 'chat_client_email';
  const CLIENT_NAME_KEY = 'chat_client_name';
  const ROOM_ID_KEY = 'chat_room_id';

  // Save client data to localStorage
  const saveClientData = (email: string, name: string, roomId?: string) => {
    try {
      console.log('Saving client data:', { email, name, roomId });
      
      // Only save if email is not empty
      if (email && email.trim()) {
        localStorage.setItem(CLIENT_EMAIL_KEY, email);
        localStorage.setItem(CLIENT_NAME_KEY, name || '');
        if (roomId) {
          localStorage.setItem(ROOM_ID_KEY, roomId);
        }
        console.log('Client data saved successfully');
      } else {
        console.warn('Attempted to save empty email, skipping save');
        console.trace('Stack trace for empty email save attempt');
      }
    } catch (error) {
      console.warn('Failed to save client data to localStorage:', error);
    }
  };

  // Load client data from localStorage
  const loadClientData = () => {
    try {
      const email = localStorage.getItem(CLIENT_EMAIL_KEY);
      const name = localStorage.getItem(CLIENT_NAME_KEY);
      const roomId = localStorage.getItem(ROOM_ID_KEY);
      
      console.log('Loading client data from localStorage:', { email, name, roomId });
      
      if (email) {
        console.log('Client data found and returned');
        return { email, name, roomId };
      } else {
        console.log('No email found in localStorage');
      }
      } catch (error) {
      console.warn('Failed to load client data from localStorage:', error);
      }
    console.log('Returning null from loadClientData');
    return null;
  };

  // Clear client data from localStorage
  const clearClientData = () => {
    try {
      console.log('Clearing all client data from localStorage');
      localStorage.removeItem(CLIENT_EMAIL_KEY);
      localStorage.removeItem(CLIENT_NAME_KEY);
      localStorage.removeItem(ROOM_ID_KEY);
    } catch (error) {
      console.warn('Failed to clear client data from localStorage:', error);
    }
  };

  // Clear only room data, keep email and name
  const clearRoomData = () => {
    try {
      console.log('Clearing room data from localStorage');
      localStorage.removeItem(ROOM_ID_KEY);
    } catch (error) {
      console.warn('Failed to clear room data from localStorage:', error);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-scroll when chat state changes to 'chatting'
  useEffect(() => {
    if (chatState === 'chatting') {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatState]);

  // Auto-scroll when widget is opened
  useEffect(() => {
    if (isOpen && chatState === 'chatting' && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, chatState, messages.length]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Set up WebSocket event handlers
  useEffect(() => {
    // Handle successful room join
    on('joined-room', (data) => {
      console.log('Successfully joined room:', data);
      // Get notification counts when joining a room
      if (clientEmail) {
        getNotificationCounts(clientEmail, 'client');
      }
    });

    // Handle new messages
    on('new-message', (data) => {
      console.log('New message received:', data);
      setMessages(prev => [...prev.filter(m => m.messageId !== data.message.messageId), {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      }]);
      
      // Scroll to bottom after message is added
      setTimeout(scrollToBottom, 100);
      
      // Update room info if available
      if (data.room) {
        setCurrentRoom(prev => prev ? {
          ...prev,
          status: data.room.status,
          assignedAgentEmail: data.room.assignedAgentEmail,
          lastActivity: new Date(data.room.lastActivity)
        } : null);
        
        // Update unread count for client
        if (data.room.unreadCountForClient !== undefined) {
          console.log('Updating unread count from new message:', data.room.unreadCountForClient);
          setUnreadCount(data.room.unreadCountForClient);
        }
      }
    });

    // Handle messages marked as read
    on('messages-read', (data) => {
      console.log('Messages marked as read:', data);
      
      // Update room info if available
      if (data.room) {
        setCurrentRoom(prev => prev ? {
          ...prev,
          lastActivity: new Date(),
        } : null);
        
        // Update unread count for client
        if (data.room.unreadCountForClient !== undefined) {
          console.log('Updating unread count from messages read:', data.room.unreadCountForClient);
          setUnreadCount(data.room.unreadCountForClient);
        }
      }
    });

    // Handle notification count updates
    on('notification-counts-updated', (data) => {
      console.log('Notification counts updated:', data);
      if (data.userEmail === clientEmail && data.userType === 'client') {
        // Find the unread count for the current room
        const currentRoomCount = data.roomCounts.find(room => room.roomId === currentRoom?.roomId);
        if (currentRoomCount) {
          console.log('Updating unread count from notification:', currentRoomCount.unreadCount);
          setUnreadCount(currentRoomCount.unreadCount);
      } else {
          console.log('Resetting unread count to 0 from notification');
          setUnreadCount(0);
        }
      }
    });

    // Handle room status changes
    on('room-status-changed', (data) => {
      console.log('Room status changed:', data);
      setCurrentRoom(prev => prev ? {
        ...prev,
        status: data.status as any,
        assignedAgentEmail: data.assignedAgentEmail,
      } : null);
      
      // If room is closed, check if client can create new room
      if (data.status === 'closed' && clientEmail) {
        checkCanCreateNewRoom(clientEmail);
      }
    });

    // Handle user joined/left
    on('user-joined', (data) => {
      console.log('User joined room:', data);
    });

    on('user-left', (data) => {
      console.log('User left room:', data);
    });

    // Handle errors
    on('error', (data) => {
      console.error('WebSocket error:', data);
      setError(data.message);
    });

    // Cleanup event handlers on unmount
    return () => {
      off('joined-room');
      off('new-message');
      off('messages-read');
      off('notification-counts-updated');
      off('room-status-changed');
      off('user-joined');
      off('user-left');
      off('error');
    };
  }, [on, off, clientEmail, currentRoom?.roomId, getNotificationCounts]);

  // Load existing room when chat opens
  useEffect(() => {
    if (isOpen && isConnected && currentRoom && currentRoom.roomId) {
      // Only join the WebSocket room if we have a current room
      joinRoom(currentRoom.roomId, clientEmail, 'client');
    }
  }, [isOpen, isConnected, currentRoom, clientEmail, joinRoom]);

  // Mark messages as read when widget is opened
  useEffect(() => {
    if (isOpen && currentRoom && clientEmail && isConnected) {
      // Mark all messages as read when the widget is opened
      markMessagesAsRead(currentRoom.roomId, clientEmail, 'client');
    }
  }, [isOpen, currentRoom, clientEmail, isConnected, markMessagesAsRead]);

  // Initialize conversation data on component mount
  useEffect(() => {
    console.log('Initializing conversation data...');
    const clientData = loadClientData();
    if (clientData) {
      console.log('Found existing client data:', clientData);
      // Set the client data from localStorage
      setClientEmail(clientData.email);
      setClientName(clientData.name || '');
      
      // Check if client can create new room
      checkCanCreateNewRoom(clientData.email);
      
      if (clientData.roomId) {
        // Load the room data in the background
        console.log('Loading existing room:', clientData.roomId);
        loadExistingRoom(clientData.roomId);
        } else {
        console.log('No room ID found, checking for recent room');
        checkForRecentRoom(clientData.email);
      }
    } else {
      console.log('No existing client data found');
    }
  }, []);

  // Check if client can create new room
  const checkCanCreateNewRoom = async (email: string) => {
    try {
      const response = await fetch(`/api/chat-rooms/client/${encodeURIComponent(email)}?recent=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCanCreateNewRoom(data.data.canCreateNewRoom);
      }
    } catch (error) {
      console.error('Error checking if can create new room:', error);
    }
  };

  // Check for recent room (including closed ones)
  const checkForRecentRoom = async (email: string) => {
    try {
      const response = await fetch(`/api/chat-rooms/client/${encodeURIComponent(email)}?recent=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const { room, canCreateNewRoom: canCreate } = data.data;
        setCanCreateNewRoom(canCreate);
        
        if (room) {
          console.log('Found recent room:', room.roomId, 'Status:', room.status);
          
          if (room.status === 'closed') {
            // If room is closed and user can create new room, show history
            if (canCreate) {
              console.log('Room is closed and can create new room, loading history...');
              const history = await loadChatHistory(email);
              if (history.length > 0) {
                setChatState('history');
              } else {
                console.log('No history found, showing email input');
                setChatState('email-input');
              }
            } else {
              // Show closed room but allow creating new room
              setCurrentRoom(room);
              setMessages(room.messages?.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })) || []);
              setChatState('chatting');
              
              // Save room data to localStorage
              const clientData = loadClientData();
              saveClientData(email, clientData?.name || '', room.roomId);
            }
          } else {
            // Load active/waiting room normally
            loadExistingRoom(room.roomId);
          }
        } else {
          console.log('No recent room found');
          setChatState('email-input');
        }
      }
    } catch (error) {
      console.error('Error checking for recent room:', error);
    }
  };

  // Debug state changes
  useEffect(() => {
    console.log('State changed:', { clientEmail, clientName, chatState });
  }, [clientEmail, clientName, chatState]);

  // Load existing room
  const loadExistingRoom = async (roomId: string) => {
    console.log('Loading existing room:', roomId);
    try {
      const response = await fetch(`/api/chat-rooms/${roomId}`);
      const data = await response.json();

      console.log('Room data response:', data);

      // Handle the nested response format from backend
      const room = data.data || data;
      
      if (room && room.roomId) {
        console.log('Room loaded successfully:', room.roomId, 'Messages:', room.messages?.length);
        
        // Get client data from localStorage to use for saving
        const clientData = loadClientData();
        
        setCurrentRoom(room);
        setMessages(room.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []);
        setChatState('chatting');
        
        // Scroll to bottom after loading messages (multiple attempts to ensure it works)
        setTimeout(scrollToBottom, 200);
        setTimeout(scrollToBottom, 500);
        setTimeout(scrollToBottom, 1000);
        
        // Initialize unread count from room data
        if (room.unreadCountForClient !== undefined) {
          console.log('Initializing unread count from room data:', room.unreadCountForClient);
          setUnreadCount(room.unreadCountForClient);
        }
        
        // Update localStorage with current room ID using the client data from localStorage
        if (clientData && clientData.email) {
          saveClientData(clientData.email, clientData.name || '', room.roomId);
        }
      } else {
        console.log('Room not found or invalid, starting fresh');
        console.log('Response data:', data);
        // Room not found, start fresh
        setChatState('email-input');
        clearRoomData();
      }
    } catch (error) {
      console.error('Error loading existing room:', error);
      console.error('Error details:', error);
      setChatState('email-input');
      clearRoomData();
    }
  };

  // Handle email form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientEmail.trim()) {
      setError('Please enter your email address');
        return;
      }

    if (!isValidEmail(clientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setChatState('loading');

    // Save client data immediately to localStorage
    saveClientData(clientEmail, clientName);

    try {
      // First, check for recent room (including closed ones) and if can create new
      const recentRoomResponse = await fetch(`/api/chat-rooms/client/${encodeURIComponent(clientEmail)}?recent=true`);
      const recentRoomData = await recentRoomResponse.json();

      if (recentRoomData.success && recentRoomData.data) {
        const { room: recentRoom, canCreateNewRoom: canCreate } = recentRoomData.data;
        setCanCreateNewRoom(canCreate);

        if (recentRoom && (recentRoom.status === 'active' || recentRoom.status === 'waiting')) {
          // Load existing active/waiting room
          setCurrentRoom(recentRoom);
          setMessages(recentRoom.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []);
          saveClientData(clientEmail, clientName, recentRoom.roomId);
          setChatState('chatting');
          
          // Scroll to bottom after loading messages
          setTimeout(scrollToBottom, 200);
          
          // Join the WebSocket room
          if (isConnected) {
            joinRoom(recentRoom.roomId, clientEmail, 'client');
          }
        } else if (canCreate) {
          // Create new room if allowed
          const createRoomResponse = await fetch('/api/chat-rooms', {
            method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              clientEmail: clientEmail.trim(),
              clientName: clientName.trim() || undefined,
              initialMessage: 'Hello! I need help with your service.',
          }),
        });

          const createRoomData = await createRoomResponse.json();
          const newRoom = createRoomData.data || createRoomData;

          if (newRoom && newRoom.roomId) {
            setCurrentRoom(newRoom);
            setMessages(newRoom.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })) || []);
            saveClientData(clientEmail, clientName, newRoom.roomId);
            setChatState('chatting');
            
            // Scroll to bottom after loading messages
            setTimeout(scrollToBottom, 200);

            // Join the WebSocket room
            if (isConnected) {
              joinRoom(newRoom.roomId, clientEmail, 'client');
            }
          } else {
            setError('Failed to start chat. Please try again.');
            setChatState('email-input');
          }
        } else if (recentRoom && recentRoom.status === 'closed') {
          // Show closed room but don't allow new messages
          setCurrentRoom(recentRoom);
          setMessages(recentRoom.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []);
          saveClientData(clientEmail, clientName, recentRoom.roomId);
          setChatState('chatting');
          
          // Scroll to bottom after loading messages
          setTimeout(scrollToBottom, 200);
        } else {
          setError('You already have an active chat session. Please wait for it to be resolved.');
          setChatState('email-input');
        }
      } else {
        setError('Failed to check chat status. Please try again.');
        setChatState('email-input');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start chat. Please try again.');
      setChatState('email-input');
    }
  };

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !currentRoom) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      if (isConnected && wsCurrentRoom === currentRoom.roomId) {
        // Send via WebSocket
        wsSendMessage(currentRoom.roomId, messageContent, 'client', clientEmail);
        // Scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const response = await fetch(`/api/chat-rooms/${currentRoom.roomId}/messages`, {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            sender: 'client',
            senderEmail: clientEmail,
          }),
        });

        const data = await response.json();

        // Handle the nested response format from backend
        const room = data.data || data;

        if (room && room.roomId) {
          setMessages(room.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []);
          setCurrentRoom(room);
          // Scroll to bottom after updating
          setTimeout(scrollToBottom, 100);
        } else {
          setError('Failed to send message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle new chat
  const handleNewChat = () => {
    // Leave current room if connected
    if (currentRoom && wsCurrentRoom === currentRoom.roomId) {
      leaveRoom(currentRoom.roomId);
    }
    
    clearClientData();
    setCurrentRoom(null);
    setMessages([]);
    setClientEmail('');
    setClientName('');
    setChatState('email-input');
    setError('');
  };

  // Handle creating new room (when current room is closed)
  const handleCreateNewRoom = async () => {
    if (!clientEmail || !canCreateNewRoom) {
      setError('Cannot create new room at this time');
      return;
    }

    setError('');
    setIsTyping(true);

    try {
      const createRoomResponse = await fetch('/api/chat-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim() || undefined,
          initialMessage: 'Hello! I need help with your service.',
        }),
      });

      const createRoomData = await createRoomResponse.json();
      const newRoom = createRoomData.data || createRoomData;

      if (newRoom && newRoom.roomId) {
        // Leave current room if connected
        if (currentRoom && wsCurrentRoom === currentRoom.roomId) {
          leaveRoom(currentRoom.roomId);
        }

        setCurrentRoom(newRoom);
        setMessages(newRoom.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []);
        saveClientData(clientEmail, clientName, newRoom.roomId);
        setCanCreateNewRoom(false);
        
        // Scroll to bottom after loading messages
        setTimeout(scrollToBottom, 200);

        // Join the WebSocket room
        if (isConnected) {
          joinRoom(newRoom.roomId, clientEmail, 'client');
        }
      } else {
        setError('Failed to create new chat. Please try again.');
      }
    } catch (error) {
      console.error('Error creating new room:', error);
      setError('Failed to create new chat. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Load chat history for the client
  const loadChatHistory = async (email: string) => {
    try {
      const response = await fetch(`/api/chat-rooms/client/${encodeURIComponent(email)}?history=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setChatHistory(data.data);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  };

  // Handle viewing chat history
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

  // Handle selecting a room from history
  const handleSelectHistoryRoom = (room: ChatRoom) => {
    setSelectedHistoryRoom(room);
    setCurrentRoom(room);
    setMessages(room.messages?.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) || []);
    
    // Don't join WebSocket room for closed rooms
    if (room.status !== 'closed') {
      if (isConnected) {
        joinRoom(room.roomId, clientEmail, 'client');
      }
    }
    
    // Scroll to bottom after loading messages
    setTimeout(scrollToBottom, 200);
  };

  // Handle going back to current chat from history
  const handleBackToCurrentChat = async () => {
    if (!clientEmail) {
      setChatState('email-input');
      return;
    }

    // Check for recent room
    try {
      const response = await fetch(`/api/chat-rooms/client/${encodeURIComponent(clientEmail)}?recent=true`);
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
          
          // Join WebSocket room if not closed
          if (room.status !== 'closed' && isConnected) {
            joinRoom(room.roomId, clientEmail, 'client');
          }
          
          // Scroll to bottom after loading messages
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

  // Get room status display
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
    <>
      {/* Chat toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          >
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse"></div>
            
            <motion.button
              onClick={() => setIsOpen(true)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white'
                  : 'bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 text-white'
              } hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Start chat"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                
              {/* Unread message badge */}
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`rounded-2xl overflow-hidden shadow-2xl border ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              {/* Chat header */}
              <div className={`p-4 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-800/50 to-purple-800/50 border-b border-gray-800'
                  : 'bg-gradient-to-r from-blue-100 to-purple-100 border-b border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold">CS</span>
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Chat Support
                        {currentRoom && (
                          <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            #{currentRoom.roomId}
                          </span>
                        )}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getRoomStatusDisplay()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {chatState === 'chatting' && (
                      <motion.button
                        onClick={handleViewHistory}
                        className={`p-1.5 rounded-full ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-white/40 hover:bg-white/60 text-gray-600'
                        } transition-colors`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title="Chat history"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </motion.button>
                    )}
                    
                    {chatState === 'chatting' && selectedHistoryRoom && (
                      <motion.button
                        onClick={() => setChatState('history')}
                        className={`p-1.5 rounded-full ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-white/40 hover:bg-white/60 text-gray-600'
                        } transition-colors`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title="Back to history"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </motion.button>
                    )}
                    
                    {chatState === 'chatting' && currentRoom?.status === 'closed' && canCreateNewRoom && (
                      <motion.button
                        onClick={handleCreateNewRoom}
                        className={`p-1.5 rounded-full ${
                          isDark
                            ? 'bg-green-700 hover:bg-green-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        } transition-colors`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title="Start new chat"
                        disabled={isTyping}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </motion.button>
                    )}
                    
                    <motion.button
                      onClick={() => setIsOpen(false)}
                      className={`p-1.5 rounded-full ${
                        isDark
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          : 'bg-white/40 hover:bg-white/60 text-gray-600'
                      } transition-colors`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Chat content */}
              <div className={`h-80 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {chatState === 'email-input' && (
                  <div className="p-4 h-full flex flex-col justify-center">
                    <div className="text-center mb-6">
                      <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Welcome to Chat Support
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Please enter your email to start chatting with our support team
                      </p>
                      {!isConnected && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {connectionError ? `Connection error: ${connectionError}` : 'Connecting to chat service...'}
                        </p>
                      )}
                    </div>
                    
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                          {error}
                        </div>
                      )}
                      
                      <div>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="Your email address *"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          required
                        />
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Your name (optional)"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!isConnected}
                        className={`w-full py-2 px-4 rounded-lg transition-colors ${
                          isConnected 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isConnected ? 'Start Chat' : 'Connecting...'}
                      </button>
                    </form>
                  </div>
                )}

                {chatState === 'loading' && (
                  <div className="p-4 h-full flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading chat...
                      </span>
                    </div>
                  </div>
                )}

                {chatState === 'history' && (
                  <div className="h-full flex flex-col">
                    {/* History header */}
                    <div className={`p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          Chat History
                        </h4>
                        <button
                          onClick={handleBackToCurrentChat}
                          className={`text-sm px-3 py-1 rounded ${
                            isDark
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          } transition-colors`}
                        >
                          Back to Chat
                        </button>
                      </div>
                    </div>

                    {/* History list */}
                    <div className="flex-1 overflow-y-auto">
                      {chatHistory.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No chat history found
                          </p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {chatHistory.map((room) => (
                            <div
                              key={room.roomId}
                              onClick={() => handleSelectHistoryRoom(room)}
                              className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                                selectedHistoryRoom?.roomId === room.roomId
                                  ? isDark
                                    ? 'bg-blue-800 border-blue-600'
                                    : 'bg-blue-100 border-blue-300'
                                  : isDark
                                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                  : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                              } border`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {room.roomId}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  room.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : room.status === 'waiting'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {room.status?.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {room.messages?.length || 0} messages
                                </span>
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(room.lastActivity).toLocaleDateString()}
                                </span>
                              </div>
                              {room.messages && room.messages.length > 0 && (
                                <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Last: {room.messages[room.messages.length - 1]?.content?.substring(0, 50)}
                                  {room.messages[room.messages.length - 1]?.content?.length > 50 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* New chat button if can create new room */}
                    {canCreateNewRoom && (
                      <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <button
                          onClick={handleCreateNewRoom}
                          disabled={isTyping}
                          className={`w-full py-2 px-4 rounded-lg ${
                            isTyping
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                          } text-white transition-colors`}
                        >
                          {isTyping ? 'Creating...' : 'Start New Chat'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {chatState === 'chatting' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4" style={{ scrollBehavior: 'smooth' }}>
                    {messages.map((message) => (
                      <div
                          key={message.messageId}
                          className={`mb-3 ${message.sender === 'client' ? 'text-right' : 'text-left'}`}
                      >
                        <div
                          className={`inline-block max-w-[85%] rounded-lg px-4 py-2 ${
                              message.sender === 'client'
                              ? isDark
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                              : isDark
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                            <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                              message.sender === 'client'
                                ? 'text-blue-200'
                              : isDark
                              ? 'text-gray-500'
                              : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="mb-3 text-left">
                        <div className={`inline-block rounded-lg px-4 py-2 ${
                          isDark
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

                    {/* Message input */}
              <form onSubmit={handleSendMessage} className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-2">
                          {error}
                        </div>
                      )}
                      
                      {currentRoom?.status === 'closed' ? (
                        <div className={`p-3 rounded text-sm text-center ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <div className="flex flex-col items-center space-y-2">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>This chat session has been closed</span>
                            {canCreateNewRoom && (
                              <button
                                onClick={handleCreateNewRoom}
                                disabled={isTyping}
                                className={`px-4 py-2 rounded text-sm ${
                                  isDark
                                    ? 'bg-green-700 hover:bg-green-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                } transition-colors disabled:opacity-50`}
                              >
                                {isTyping ? 'Creating...' : 'Start New Chat'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex">
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className={`flex-1 px-4 py-2 rounded-l-lg focus:outline-none ${
                              isDark
                                ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700'
                                : 'bg-gray-100 text-gray-800 placeholder-gray-500 border-gray-200'
                            }`}
                            disabled={isTyping}
                          />
                          <button
                            type="submit"
                            className={`px-4 py-2 rounded-r-lg ${
                              !inputValue.trim() || isTyping || !isConnected
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                            } text-white transition-colors`}
                            disabled={!inputValue.trim() || isTyping || !isConnected}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
              </form>
                  </div>
                )}
              </div>

              {/* Chat footer */}
              <div className={`px-3 py-2 text-center text-xs ${isDark ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                <p>
                  Powered by Chat Support
                  {currentRoom && (
                    <span className="inline-flex items-center ml-2">
                          <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                      Room: {currentRoom.roomId}
                        </span>
                      )}
                  {isConnected && (
                    <span className="inline-flex items-center ml-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Live
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}