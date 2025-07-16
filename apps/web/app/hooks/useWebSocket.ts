import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  messageId: string;
  content: string;
  sender: 'client' | 'agent';
  senderEmail?: string;
  timestamp: Date;
  isRead: boolean;
  readBy?: Array<{
    userEmail: string;
    userType: 'client' | 'agent';
    readAt: Date;
  }>;
}

interface Room {
  roomId: string;
  status: 'active' | 'waiting' | 'closed';
  assignedAgentEmail?: string;
  lastActivity: Date;
  unreadCountForClient?: number;
  unreadCountForAgent?: number;
  lastReadByClient?: Date;
  lastReadByAgent?: Date;
}

interface NotificationCounts {
  totalUnread: number;
  roomCounts: Array<{
    roomId: string;
    unreadCount: number;
    clientEmail: string;
    status: string;
  }>;
}

interface WebSocketEvents {
  'joined-room': (data: { roomId: string; userEmail: string; userType: string }) => void;
  'left-room': (data: { roomId: string }) => void;
  'new-message': (data: { message: Message; room: Room }) => void;
  'room-status-changed': (data: { roomId: string; status: string; assignedAgentEmail?: string; closedAt?: Date }) => void;
  'user-joined': (data: { userEmail: string; userType: string }) => void;
  'user-left': (data: { userEmail: string; userType: string }) => void;
  'room-info': (data: any) => void;
  'room-list-updated': (data: { rooms: any[] }) => void;
  'messages-read': (data: { roomId: string; userEmail: string; userType: string; messageIds?: string[]; room: Room }) => void;
  'notification-counts': (data: NotificationCounts & { userEmail: string; userType: string }) => void;
  'notification-counts-updated': (data: NotificationCounts & { userEmail: string; userType: string }) => void;
  'notification-count-reset': (data: { roomId: string; userType: string }) => void;
  'agent-registered': (data: { userEmail: string }) => void;
  'error': (data: { message: string }) => void;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  serverUrl?: string;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    totalUnread: 0,
    roomCounts: []
  });
  const eventHandlersRef = useRef<Partial<WebSocketEvents>>({});

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('Connecting to WebSocket server:', `${serverUrl}/chat`);
    
    socketRef.current = io(`${serverUrl}/chat`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setCurrentRoom(null);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Set up event handlers
    Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
      if (handler) {
        socket.on(event, handler);
      }
    });

  }, [serverUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setCurrentRoom(null);
    }
  }, []);

  // Register as an agent to receive room list updates
  const registerAgent = useCallback((userEmail: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Registering as agent:', userEmail);
    socketRef.current.emit('register-agent', { userEmail });
  }, []);

  // Join a chat room
  const joinRoom = useCallback((roomId: string, userEmail: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Joining room:', { roomId, userEmail, userType });
    socketRef.current.emit('join-room', { roomId, userEmail, userType });
    setCurrentRoom(roomId);
  }, []);

  // Leave current room
  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Leaving room:', roomId);
    socketRef.current.emit('leave-room', { roomId });
    setCurrentRoom(null);
  }, []);

  // Send message
  const sendMessage = useCallback((roomId: string, content: string, sender: 'client' | 'agent', senderEmail: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Sending message:', { roomId, content, sender, senderEmail });
    socketRef.current.emit('send-message', {
      roomId,
      content,
      sender,
      senderEmail,
    });
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback((roomId: string, userEmail: string, userType: 'client' | 'agent', messageIds?: string[]) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Marking messages as read:', { roomId, userEmail, userType, messageIds });
    socketRef.current.emit('mark-messages-read', {
      roomId,
      userEmail,
      userType,
      messageIds,
    });
  }, []);

  // Get notification counts
  const getNotificationCounts = useCallback((userEmail: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Getting notification counts:', { userEmail, userType });
    socketRef.current.emit('get-notification-counts', {
      userEmail,
      userType,
    });
  }, []);

  // Reset notification count for a room
  const resetNotificationCount = useCallback((roomId: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Resetting notification count:', { roomId, userType });
    socketRef.current.emit('reset-notification-count', {
      roomId,
      userType,
    });
  }, []);

  // Update room status (agents only)
  const updateRoomStatus = useCallback((roomId: string, status: string, assignedAgentEmail?: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Updating room status:', { roomId, status, assignedAgentEmail });
    socketRef.current.emit('update-room-status', {
      roomId,
      status,
      assignedAgentEmail,
    });
  }, []);

  // Get room info
  const getRoomInfo = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Getting room info:', roomId);
    socketRef.current.emit('get-room-info', { roomId });
  }, []);

  // Register event handler
  const on = useCallback(<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]) => {
    eventHandlersRef.current[event] = handler;
    
    if (socketRef.current?.connected) {
      socketRef.current.on(event, handler as any);
    }
  }, []);

  // Unregister event handler
  const off = useCallback(<K extends keyof WebSocketEvents>(event: K) => {
    delete eventHandlersRef.current[event];
    
    if (socketRef.current?.connected) {
      socketRef.current.off(event);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Re-register event handlers when socket reconnects
  useEffect(() => {
    if (socketRef.current?.connected) {
      Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
        if (handler) {
          socketRef.current!.on(event, handler as any);
        }
      });
    }
  }, [isConnected]);

  // Set up notification count handlers
  useEffect(() => {
    const handleNotificationCounts = (data: NotificationCounts & { userEmail: string; userType: string }) => {
      console.log('Received notification counts:', data);
      setNotificationCounts({
        totalUnread: data.totalUnread,
        roomCounts: data.roomCounts
      });
    };

    const handleNotificationCountsUpdated = (data: NotificationCounts & { userEmail: string; userType: string }) => {
      console.log('Notification counts updated:', data);
      setNotificationCounts({
        totalUnread: data.totalUnread,
        roomCounts: data.roomCounts
      });
    };

    on('notification-counts', handleNotificationCounts);
    on('notification-counts-updated', handleNotificationCountsUpdated);

    return () => {
      off('notification-counts');
      off('notification-counts-updated');
    };
  }, [on, off]);

  return {
    isConnected,
    connectionError,
    currentRoom,
    notificationCounts,
    connect,
    disconnect,
    registerAgent,
    joinRoom,
    leaveRoom,
    sendMessage,
    markMessagesAsRead,
    getNotificationCounts,
    resetNotificationCount,
    updateRoomStatus,
    getRoomInfo,
    on,
    off,
  };
}; 