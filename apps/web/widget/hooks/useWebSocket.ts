'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketEvents, NotificationCounts } from '../types';
import { getWidgetConfig } from '../config';

export function useWebSocket(serverUrl?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    totalUnread: 0,
    roomCounts: []
  });
  const eventHandlersRef = useRef<Partial<WebSocketEvents>>({});

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socketServerUrl = serverUrl || getWidgetConfig().socketUrl;
    socketRef.current = io(`${socketServerUrl}/chat`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setCurrentRoom(null);
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    });

    Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
      if (handler) {
        socket.on(event, handler as any);
      }
    });
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setCurrentRoom(null);
    }
  }, []);

  const joinRoom = useCallback((roomId: string, userEmail: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('join-room', { roomId, userEmail, userType });
    setCurrentRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('leave-room', { roomId });
    setCurrentRoom(null);
  }, []);

  const sendMessage = useCallback((roomId: string, content: string, sender: 'client' | 'agent', senderEmail: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('send-message', {
      roomId,
      content,
      sender,
      senderEmail,
    });
  }, []);

  const markMessagesAsRead = useCallback((roomId: string, userEmail: string, userType: 'client' | 'agent', messageIds?: string[]) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark-messages-read', {
      roomId,
      userEmail,
      userType,
      messageIds,
    });
  }, []);

  const getNotificationCounts = useCallback((userEmail: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('get-notification-counts', {
      userEmail,
      userType,
    });
  }, []);

  const resetNotificationCount = useCallback((roomId: string, userType: 'client' | 'agent') => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('reset-notification-count', {
      roomId,
      userType,
    });
  }, []);

  const on = useCallback(<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]) => {
    eventHandlersRef.current[event] = handler;
    
    if (socketRef.current?.connected) {
      socketRef.current.on(event as string, handler as any);
    }
  }, []);

  const off = useCallback(<K extends keyof WebSocketEvents>(event: K) => {
    delete eventHandlersRef.current[event];
    
    if (socketRef.current?.connected) {
      socketRef.current.off(event as string);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (socketRef.current?.connected) {
      Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
        if (handler) {
          socketRef.current!.on(event, handler as any);
        }
      });
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    currentRoom,
    notificationCounts,
    joinRoom,
    leaveRoom,
    sendMessage,
    markMessagesAsRead,
    getNotificationCounts,
    resetNotificationCount,
    on,
    off,
  };
} 