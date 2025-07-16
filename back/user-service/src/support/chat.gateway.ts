import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomStatus } from './schemas/chat-room.schema';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3078', // Next.js frontend
        'http://localhost:8080', // Demo server
        'http://localhost:3000', // Alternative React dev server
        'http://127.0.0.1:8080', // Alternative localhost format
        'http://127.0.0.1:3078', // Alternative localhost format
      ];
      
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/, // Any localhost port for development
        /^http:\/\/127\.0\.0\.1:\d+$/, // Any 127.0.0.1 port for development
        /^file:\/\//, // Support for file:// protocol (local HTML files)
      ];
      
      // Allow requests with no origin (null origin) - this happens with file:// protocol
      if (!origin || origin === 'null') {
        return callback(null, true);
      }
      
      // Check exact matches
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check pattern matches
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { socket: Socket; userEmail: string; userType: 'client' | 'agent' }>();

  constructor(private readonly chatRoomService: ChatRoomService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove user from connected users map
    this.connectedUsers.delete(client.id);
    
    // Leave all rooms
    const rooms = Array.from(client.rooms);
    rooms.forEach(room => {
      if (room !== client.id) {
        client.leave(room);
        this.server.to(room).emit('user-left', { socketId: client.id });
      }
    });
  }

  @SubscribeMessage('register-agent')
  async handleRegisterAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userEmail: string }
  ) {
    try {
      const { userEmail } = data;
      
      this.logger.log(`Agent ${userEmail} registering for room list updates`);
      
      // Store user info as agent
      this.connectedUsers.set(client.id, { socket: client, userEmail, userType: 'agent' });
      
      // Send confirmation to the user
      client.emit('agent-registered', { userEmail });
      
      // Send initial room list to the agent
      await this.sendRoomListToAgent(client, userEmail);
      
    } catch (error) {
      this.logger.error('Error registering agent:', error);
      client.emit('error', { message: 'Failed to register agent' });
    }
  }

  // Helper method to send room list to a specific agent
  async sendRoomListToAgent(socket: Socket, userEmail: string) {
    try {
      const result = await this.chatRoomService.getChatRooms({});
      this.logger.log(`Sending room list to agent ${userEmail}: ${result.rooms.length} rooms`);
      socket.emit('room-list-updated', { rooms: result.rooms });
    } catch (error) {
      this.logger.error('Error sending room list to agent:', error);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userEmail: string; userType: 'client' | 'agent' }
  ) {
    try {
      const { roomId, userEmail, userType } = data;
      
      this.logger.log(`User ${userEmail} (${userType}) joining room ${roomId}`);
      
      // Store user info
      this.connectedUsers.set(client.id, { socket: client, userEmail, userType });
      
      // Join the room
      await client.join(roomId);
      
      // Notify others in the room
      client.to(roomId).emit('user-joined', { userEmail, userType });
      
      // Send confirmation to the user
      client.emit('joined-room', { roomId, userEmail, userType });
      
      // If it's an agent joining, update room status to active
      if (userType === 'agent') {
        await this.chatRoomService.updateChatRoom(roomId, { 
          status: ChatRoomStatus.ACTIVE, 
          assignedAgentEmail: userEmail 
        });
        
        // Notify all users in the room about status change
        this.server.to(roomId).emit('room-status-changed', {
          roomId,
          status: 'active',
          assignedAgentEmail: userEmail
        });
      }
      
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const { roomId } = data;
      const userInfo = this.connectedUsers.get(client.id);
      
      if (userInfo) {
        this.logger.log(`User ${userInfo.userEmail} leaving room ${roomId}`);
        
        await client.leave(roomId);
        
        // Notify others in the room
        client.to(roomId).emit('user-left', { 
          userEmail: userInfo.userEmail, 
          userType: userInfo.userType 
        });
        
        // Send confirmation
        client.emit('left-room', { roomId });
      }
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string; sender: 'client' | 'agent'; senderEmail: string }
  ) {
    try {
      const { roomId, content, sender, senderEmail } = data;
      
      this.logger.log(`Message from ${senderEmail} in room ${roomId}: ${content}`);
      
      // Save message to database
      const updatedRoom = await this.chatRoomService.sendMessage(roomId, {
        content,
        sender,
        senderEmail,
      });
      
      // Get the latest message
      const latestMessage = updatedRoom.messages[updatedRoom.messages.length - 1];
      
      // Broadcast message to all users in the room
      this.server.to(roomId).emit('new-message', {
        message: latestMessage,
        room: {
          roomId: updatedRoom.roomId,
          status: updatedRoom.status,
          assignedAgentEmail: updatedRoom.assignedAgentEmail,
          lastActivity: updatedRoom.lastActivity,
          unreadCountForClient: updatedRoom.unreadCountForClient,
          unreadCountForAgent: updatedRoom.unreadCountForAgent,
        }
      });
      
      // Broadcast notification count updates to all connected agents
      this.logger.log('Broadcasting notification counts after message send...');
      await this.broadcastNotificationCounts();
      
      // Broadcast room list updates to all connected agents
      this.logger.log('Broadcasting room list update after message send...');
      await this.broadcastRoomListUpdate();
      
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark-messages-read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userEmail: string; userType: 'client' | 'agent'; messageIds?: string[] }
  ) {
    try {
      const { roomId, userEmail, userType, messageIds } = data;
      
      this.logger.log(`User ${userEmail} (${userType}) marking messages as read in room ${roomId}`);
      
      // Mark messages as read in database
      const updatedRoom = await this.chatRoomService.markMessagesAsReadByUser(
        roomId,
        userEmail,
        userType,
        messageIds
      );
      
      // Notify all users in the room about read status update
      this.server.to(roomId).emit('messages-read', {
        roomId,
        userEmail,
        userType,
        messageIds,
        room: {
          roomId: updatedRoom.roomId,
          unreadCountForClient: updatedRoom.unreadCountForClient,
          unreadCountForAgent: updatedRoom.unreadCountForAgent,
          lastReadByClient: updatedRoom.lastReadByClient,
          lastReadByAgent: updatedRoom.lastReadByAgent,
        }
      });
      
      // Broadcast notification count updates
      await this.broadcastNotificationCounts();
      
      // Broadcast room list updates to all connected agents
      await this.broadcastRoomListUpdate();
      
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('get-notification-counts')
  async handleGetNotificationCounts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userEmail: string; userType: 'client' | 'agent' }
  ) {
    try {
      const { userEmail, userType } = data;
      
      const counts = await this.chatRoomService.getNotificationCounts(userEmail, userType);
      
      client.emit('notification-counts', {
        userEmail,
        userType,
        ...counts
      });
      
    } catch (error) {
      this.logger.error('Error getting notification counts:', error);
      client.emit('error', { message: 'Failed to get notification counts' });
    }
  }

  @SubscribeMessage('reset-notification-count')
  async handleResetNotificationCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userType: 'client' | 'agent' }
  ) {
    try {
      const { roomId, userType } = data;
      
      await this.chatRoomService.resetNotificationCount(roomId, userType);
      
      // Notify the user that the count was reset
      client.emit('notification-count-reset', {
        roomId,
        userType
      });
      
      // Broadcast updated notification counts
      await this.broadcastNotificationCounts();
      
    } catch (error) {
      this.logger.error('Error resetting notification count:', error);
      client.emit('error', { message: 'Failed to reset notification count' });
    }
  }

  @SubscribeMessage('update-room-status')
  async handleUpdateRoomStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; status: string; assignedAgentEmail?: string }
  ) {
    try {
      const { roomId, status, assignedAgentEmail } = data;
      const userInfo = this.connectedUsers.get(client.id);
      
      if (!userInfo || userInfo.userType !== 'agent') {
        client.emit('error', { message: 'Only agents can update room status' });
        return;
      }
      
      this.logger.log(`Agent ${userInfo.userEmail} updating room ${roomId} status to ${status}`);
      
      // Convert string status to enum
      let chatRoomStatus: ChatRoomStatus;
      switch (status) {
        case 'active':
          chatRoomStatus = ChatRoomStatus.ACTIVE;
          break;
        case 'waiting':
          chatRoomStatus = ChatRoomStatus.WAITING;
          break;
        case 'closed':
          chatRoomStatus = ChatRoomStatus.CLOSED;
          break;
        default:
          chatRoomStatus = ChatRoomStatus.WAITING;
      }
      
      // Update room status
      const updateData: any = { status: chatRoomStatus };
      if (assignedAgentEmail) {
        updateData.assignedAgentEmail = assignedAgentEmail;
      }
      if (status === 'closed') {
        updateData.closedAt = new Date();
      }
      
      await this.chatRoomService.updateChatRoom(roomId, updateData);
      
      // Notify all users in the room
      this.server.to(roomId).emit('room-status-changed', {
        roomId,
        status,
        assignedAgentEmail,
        closedAt: status === 'closed' ? new Date() : undefined
      });
      
      // Broadcast room list updates to all connected agents
      await this.broadcastRoomListUpdate();
      
    } catch (error) {
      this.logger.error('Error updating room status:', error);
      client.emit('error', { message: 'Failed to update room status' });
    }
  }

  @SubscribeMessage('get-room-info')
  async handleGetRoomInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const { roomId } = data;
      const room = await this.chatRoomService.getChatRoomById(roomId);
      
      if (room) {
        client.emit('room-info', room);
      } else {
        client.emit('error', { message: 'Room not found' });
      }
    } catch (error) {
      this.logger.error('Error getting room info:', error);
      client.emit('error', { message: 'Failed to get room info' });
    }
  }

  // Helper method to broadcast room list updates to agents
  async broadcastRoomListUpdate() {
    try {
      this.logger.log('Broadcasting room list update...');
      const result = await this.chatRoomService.getChatRooms({});
      this.logger.log(`Found ${result.rooms.length} rooms to broadcast`);
      
      // Log the latest message for each room
      result.rooms.forEach(room => {
        const latestMessage = room.messages && room.messages.length > 0 
          ? room.messages[room.messages.length - 1]
          : null;
        this.logger.log(`Room ${room.roomId}: latest message = "${latestMessage?.content || 'No messages'}" at ${latestMessage?.timestamp || 'N/A'}`);
      });
      
      // Send to all connected agents
      let agentCount = 0;
      this.connectedUsers.forEach((userInfo, socketId) => {
        if (userInfo.userType === 'agent') {
          agentCount++;
          this.logger.log(`Sending room list update to agent: ${userInfo.userEmail}`);
          userInfo.socket.emit('room-list-updated', { rooms: result.rooms });
        }
      });
      
      this.logger.log(`Broadcasted room list update to ${agentCount} agents`);
    } catch (error) {
      this.logger.error('Error broadcasting room list update:', error);
    }
  }

  // Helper method to broadcast notification counts to all connected users
  async broadcastNotificationCounts() {
    try {
      // Get all unique users
      const uniqueUsers = new Map<string, { userEmail: string; userType: 'client' | 'agent' }>();
      
      this.connectedUsers.forEach((userInfo) => {
        const key = `${userInfo.userEmail}-${userInfo.userType}`;
        uniqueUsers.set(key, {
          userEmail: userInfo.userEmail,
          userType: userInfo.userType
        });
      });
      
      // Send notification counts to each unique user
      for (const [key, userInfo] of uniqueUsers) {
        const counts = await this.chatRoomService.getNotificationCounts(
          userInfo.userEmail,
          userInfo.userType
        );
        
        // Send to all sockets for this user
        this.connectedUsers.forEach((connectedUser, socketId) => {
          if (connectedUser.userEmail === userInfo.userEmail && connectedUser.userType === userInfo.userType) {
            connectedUser.socket.emit('notification-counts-updated', {
              userEmail: userInfo.userEmail,
              userType: userInfo.userType,
              ...counts
            });
          }
        });
      }
      
    } catch (error) {
      this.logger.error('Error broadcasting notification counts:', error);
    }
  }
} 