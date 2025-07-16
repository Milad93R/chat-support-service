'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import Header from '../components/Header';

interface ChatMessage {
  messageId: string;
  content: string;
  sender: 'client' | 'agent';
  senderEmail: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatRoom {
  _id: string;
  roomId: string;
  clientEmail: string;
  status: 'waiting' | 'active' | 'closed';
  assignedAgentEmail?: string;
  messages: ChatMessage[];
  createdAt: string;
  lastActivity: string;
  notes?: string;
  tags?: string[];
  closedAt?: string;
  unreadCountForAgent?: number;
  unreadCountForClient?: number;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const isDark = theme === 'dark';
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const {
    isConnected,
    connectionError,
    currentRoom: wsCurrentRoom,
    joinRoom,
    leaveRoom,
    sendMessage: wsSendMessage,
    updateRoomStatus: wsUpdateRoomStatus,
    on,
    off,
    markMessagesAsRead,
    getNotificationCounts,
    registerAgent,
  } = useWebSocket({
    autoConnect: true,
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedRoom?.messages]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Set up WebSocket event handlers
  useEffect(() => {
    // Handle new messages
    on('new-message', (data) => {
      console.log('New message received:', data);
      
      // Update the selected room if it's the current room
      if (selectedRoom && selectedRoom.roomId === data.room.roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          messages: [...prev.messages.filter(m => m.messageId !== data.message.messageId), {
            ...data.message,
            senderEmail: data.message.senderEmail || '',
            timestamp: new Date(data.message.timestamp).toISOString()
          } as ChatMessage],
          status: data.room.status,
          assignedAgentEmail: data.room.assignedAgentEmail,
          lastActivity: new Date(data.room.lastActivity).toISOString()
        } : null);
        
        // Scroll to bottom after message is added
        setTimeout(scrollToBottom, 100);
      }
      
      // Update the room in the rooms list
      setChatRooms(prev => prev.map(room => 
        room.roomId === data.room.roomId 
          ? {
              ...room,
              messages: [...room.messages.filter(m => m.messageId !== data.message.messageId), {
                ...data.message,
                senderEmail: data.message.senderEmail || '',
                timestamp: new Date(data.message.timestamp).toISOString()
              } as ChatMessage],
              status: data.room.status,
              assignedAgentEmail: data.room.assignedAgentEmail,
              lastActivity: new Date(data.room.lastActivity).toISOString(),
              unreadCountForAgent: data.room.unreadCountForAgent,
              unreadCountForClient: data.room.unreadCountForClient
            }
          : room
      ));
    });

    // Handle room status changes
    on('room-status-changed', (data) => {
      console.log('Room status changed:', data);
      
      // Update the selected room
      if (selectedRoom && selectedRoom.roomId === data.roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          status: data.status as any,
          assignedAgentEmail: data.assignedAgentEmail,
          closedAt: data.closedAt ? new Date(data.closedAt).toISOString() : undefined
        } : null);
      }
      
      // Update the room in the rooms list
      setChatRooms(prev => prev.map(room => 
        room.roomId === data.roomId 
          ? {
              ...room,
              status: data.status as any,
              assignedAgentEmail: data.assignedAgentEmail,
              closedAt: data.closedAt ? new Date(data.closedAt).toISOString() : undefined
            }
          : room
      ));
    });

    // Handle messages marked as read
    on('messages-read', (data) => {
      console.log('Messages marked as read:', data);
      
      // Update the selected room
      if (selectedRoom && selectedRoom.roomId === data.roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          unreadCountForAgent: data.room.unreadCountForAgent,
          unreadCountForClient: data.room.unreadCountForClient
        } : null);
      }
      
      // Update the room in the rooms list
      setChatRooms(prev => prev.map(room => 
        room.roomId === data.roomId 
          ? {
              ...room,
              unreadCountForAgent: data.room.unreadCountForAgent,
              unreadCountForClient: data.room.unreadCountForClient
            }
          : room
      ));
    });

    // Handle notification count updates
    on('notification-counts-updated', (data) => {
      console.log('Notification counts updated:', data);
      if (data.userEmail === user?.email && data.userType === 'agent') {
        // Update unread counts for all rooms
        setChatRooms(prev => prev.map(room => {
          const roomCount = data.roomCounts.find(rc => rc.roomId === room.roomId);
          return roomCount ? {
            ...room,
            unreadCountForAgent: roomCount.unreadCount
          } : room;
        }));
      }
    });

    // Handle room list updates
    on('room-list-updated', (data) => {
      console.log('Room list updated:', data);
      setChatRooms(data.rooms);
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
    });

    // Cleanup event handlers on unmount
    return () => {
      off('new-message');
      off('room-status-changed');
      off('messages-read');
      off('notification-counts-updated');
      off('room-list-updated');
      off('user-joined');
      off('user-left');
      off('error');
    };
  }, [on, off, selectedRoom, user?.email]);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Request notification counts when connected
  useEffect(() => {
    if (isConnected && user?.email) {
      getNotificationCounts(user.email, 'agent');
    }
  }, [isConnected, user?.email, getNotificationCounts]);

  // Register as agent when connected
  useEffect(() => {
    if (isConnected && user?.email) {
      registerAgent(user.email);
    }
  }, [isConnected, user?.email, registerAgent]);

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat-rooms');
      if (response.ok) {
        const data = await response.json();
        // Handle the nested response format from backend
        setChatRooms(data.data?.rooms || data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room: ChatRoom) => {
    try {
      // Leave current room if connected
      if (selectedRoom && wsCurrentRoom === selectedRoom.roomId) {
        leaveRoom(selectedRoom.roomId);
      }

      const response = await fetch(`/api/chat-rooms/${room.roomId}`);
      if (response.ok) {
        const data = await response.json();
        // Handle the nested response format from backend
        const roomData = data.data || data;
        setSelectedRoom(roomData);
        
        // Join the WebSocket room as an agent
        if (isConnected && user?.email) {
          joinRoom(roomData.roomId, user.email, 'agent');
          
          // Mark messages as read for the agent
          markMessagesAsRead(roomData.roomId, user.email, 'agent');
        }
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      if (isConnected && wsCurrentRoom === selectedRoom.roomId) {
        // Send via WebSocket
        wsSendMessage(selectedRoom.roomId, messageContent, 'agent', user?.email || 'admin@example.com');
        // Scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const response = await fetch(`/api/chat-rooms/${selectedRoom.roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            sender: 'agent',
            senderEmail: user?.email || 'admin@example.com',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Handle the nested response format from backend
          const roomData = data.data || data;
          setSelectedRoom(roomData);
          // Refresh the room list
          fetchChatRooms();
          // Scroll to bottom after updating
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateRoomStatus = async (roomId: string, status: string) => {
    try {
      if (isConnected && wsCurrentRoom === roomId) {
        // Update via WebSocket
        wsUpdateRoomStatus(roomId, status, user?.email);
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const response = await fetch(`/api/chat-rooms/${roomId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          fetchChatRooms();
          if (selectedRoom?.roomId === roomId) {
            const data = await response.json();
            // Handle the nested response format from backend
            const roomData = data.data || data;
            setSelectedRoom(roomData);
          }
        }
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUnreadCount = (room: ChatRoom) => {
    const count = room.unreadCountForAgent || 0;
    console.log(`Unread count for room ${room.roomId}:`, count);
    return count;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chat Support Admin
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage chat rooms and conversations
          </p>
          {!isConnected && (
            <div className={`mt-2 text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {connectionError ? `Connection error: ${connectionError}` : 'Connecting to chat service...'}
            </div>
          )}
          {isConnected && (
            <div className={`mt-2 text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              ✓ Connected to chat service
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Rooms List */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Chat Rooms ({chatRooms.length})
                </h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No chat rooms found</p>
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <div
                      key={room.roomId}
                      onClick={() => handleRoomClick(room)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedRoom?.roomId === room.roomId ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {room.roomId}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                          {room.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        {room.clientEmail}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTime(room.lastActivity)}
                        </span>
                        {getUnreadCount(room) > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {getUnreadCount(room)}
                          </span>
                        )}
                      </div>
                      
                      {room.messages?.length > 0 && (
                        <p className={`text-sm mt-2 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {room.messages[room.messages.length - 1]?.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Room Details */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedRoom.roomId}
                      </h2>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Client: {selectedRoom.clientEmail}
                      </p>
                      {wsCurrentRoom === selectedRoom.roomId && (
                        <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          ✓ Connected via WebSocket
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRoom.status)}`}>
                        {selectedRoom.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <select
                        value={selectedRoom.status || 'waiting'}
                        onChange={(e) => updateRoomStatus(selectedRoom.roomId, e.target.value)}
                        className={`px-3 py-1 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="waiting">Waiting</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {!selectedRoom.messages || selectedRoom.messages.length === 0 ? (
                    <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No messages yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedRoom.messages.map((message) => (
                        <div
                          key={message.messageId}
                          className={`flex ${message.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === 'client'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'client' 
                                ? 'text-gray-500 dark:text-gray-400' 
                                : 'text-blue-100'
                            }`}>
                              {message.senderEmail} • {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                {selectedRoom.status !== 'closed' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        disabled={!isConnected}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || !isConnected}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          !newMessage.trim() || !isConnected
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Send
                      </button>
                    </div>
                    {!isConnected && (
                      <p className={`text-xs mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        WebSocket disconnected. Messages will use HTTP fallback.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
                <div className="text-center">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Select a chat room
                  </h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose a chat room from the list to view and manage the conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 