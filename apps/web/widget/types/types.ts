export interface WidgetConfig {
  apiBaseUrl: string;
  socketUrl: string;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface Message {
  messageId: string;
  content: string;
  sender: 'client' | 'agent';
  senderEmail?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Room {
  roomId: string;
  status: 'active' | 'waiting' | 'closed';
  assignedAgentEmail?: string;
  lastActivity: Date;
  unreadCountForClient?: number;
  unreadCountForAgent?: number;
}

export interface ChatRoom {
  roomId: string;
  clientEmail: string;
  clientName?: string;
  status: 'active' | 'waiting' | 'closed';
  assignedAgentEmail?: string;
  messages: Message[];
  unreadCountForClient?: number;
  lastActivity: Date;
  createdAt: Date;
}

export interface NotificationCounts {
  totalUnread: number;
  roomCounts: Array<{
    roomId: string;
    unreadCount: number;
    clientEmail: string;
    status: string;
  }>;
}

export interface WebSocketEvents {
  'joined-room': (data: { roomId: string; userEmail: string; userType: string }) => void;
  'left-room': (data: { roomId: string }) => void;
  'new-message': (data: { message: Message; room: Room }) => void;
  'room-status-changed': (data: { roomId: string; status: string; assignedAgentEmail?: string; closedAt?: Date }) => void;
  'user-joined': (data: { userEmail: string; userType: string }) => void;
  'user-left': (data: { userEmail: string; userType: string }) => void;
  'room-info': (data: any) => void;
  'messages-read': (data: { roomId: string; userEmail: string; userType: string; messageIds?: string[]; room: Room }) => void;
  'notification-counts': (data: NotificationCounts & { userEmail: string; userType: string }) => void;
  'notification-counts-updated': (data: NotificationCounts & { userEmail: string; userType: string }) => void;
  'error': (data: { message: string }) => void;
}

export type ChatState = 'email-input' | 'chatting' | 'loading' | 'history'; 