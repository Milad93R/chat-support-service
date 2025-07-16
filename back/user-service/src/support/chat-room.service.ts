import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatRoom, ChatRoomDocument, ChatRoomStatus } from './schemas/chat-room.schema';
import { CreateChatRoomDto, SendMessageDto, UpdateChatRoomDto, GetChatRoomsDto } from './dto/chat-room.dto';

@Injectable()
export class ChatRoomService {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
  ) {}

  // Generate unique room ID
  private generateRoomId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `ROOM-${timestamp}${random}`;
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Create a new chat room
  async createChatRoom(createChatRoomDto: CreateChatRoomDto): Promise<ChatRoomDocument> {
    const roomId = this.generateRoomId();
    
    const roomData: any = {
      ...createChatRoomDto,
      roomId,
      status: ChatRoomStatus.WAITING,
      messages: [],
      lastActivity: new Date(),
    };

    // Add initial message if provided
    if (createChatRoomDto.initialMessage) {
      roomData.messages.push({
        messageId: this.generateMessageId(),
        content: createChatRoomDto.initialMessage,
        sender: 'client',
        senderEmail: createChatRoomDto.clientEmail,
        timestamp: new Date(),
        isRead: false,
      });
    }

    const chatRoom = new this.chatRoomModel(roomData);
    return await chatRoom.save();
  }

  // Get chat room by ID
  async getChatRoomById(roomId: string): Promise<ChatRoomDocument> {
    const chatRoom = await this.chatRoomModel.findOne({ roomId }).exec();
    
    if (!chatRoom) {
      throw new NotFoundException(`Chat room with ID ${roomId} not found`);
    }

    return chatRoom;
  }

  // Get chat room by client email (most recent active room)
  async getChatRoomByClientEmail(clientEmail: string): Promise<ChatRoomDocument | null> {
    const chatRoom = await this.chatRoomModel
      .findOne({ 
        clientEmail,
        status: { $in: [ChatRoomStatus.ACTIVE, ChatRoomStatus.WAITING] }
      })
      .sort({ lastActivity: -1 })
      .exec();

    return chatRoom;
  }

  // Get most recent chat room by client email (any status)
  async getMostRecentChatRoomByClientEmail(clientEmail: string): Promise<ChatRoomDocument | null> {
    const chatRoom = await this.chatRoomModel
      .findOne({ clientEmail })
      .sort({ lastActivity: -1 })
      .exec();

    return chatRoom;
  }

  // Check if client can create new room (no active/waiting room exists)
  async canClientCreateNewRoom(clientEmail: string): Promise<boolean> {
    const activeRoom = await this.getChatRoomByClientEmail(clientEmail);
    return !activeRoom; // Can create new room if no active/waiting room exists
  }

  // Get all chat rooms for a specific client (for history page)
  async getAllChatRoomsForClient(clientEmail: string): Promise<ChatRoomDocument[]> {
    const chatRooms = await this.chatRoomModel
      .find({ clientEmail })
      .sort({ lastActivity: -1 })
      .exec();

    return chatRooms;
  }

  // Get all chat rooms with filters
  async getChatRooms(filters: GetChatRoomsDto): Promise<{ rooms: ChatRoomDocument[], total: number }> {
    const page = parseInt(filters.page || '1') || 1;
    const limit = parseInt(filters.limit || '10') || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.clientEmail) query.clientEmail = filters.clientEmail;
    if (filters.assignedAgentEmail) query.assignedAgentEmail = filters.assignedAgentEmail;

    const [rooms, total] = await Promise.all([
      this.chatRoomModel
        .find(query)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chatRoomModel.countDocuments(query)
    ]);

    return { rooms, total };
  }

  // Send message to chat room
  async sendMessage(roomId: string, sendMessageDto: SendMessageDto): Promise<ChatRoomDocument> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    if (chatRoom.status === ChatRoomStatus.CLOSED) {
      throw new BadRequestException('Cannot send message to closed chat room');
    }

    const message = {
      messageId: this.generateMessageId(),
      content: sendMessageDto.content,
      sender: sendMessageDto.sender,
      senderEmail: sendMessageDto.senderEmail,
      timestamp: new Date(),
      isRead: false,
      readBy: [],
    };

    chatRoom.messages.push(message);
    chatRoom.lastActivity = new Date();

    // Update notification counts
    if (sendMessageDto.sender === 'client') {
      chatRoom.unreadCountForAgent = (chatRoom.unreadCountForAgent || 0) + 1;
    } else if (sendMessageDto.sender === 'agent') {
      chatRoom.unreadCountForClient = (chatRoom.unreadCountForClient || 0) + 1;
    }

    // If this is the first agent message, mark room as active
    if (sendMessageDto.sender === 'agent' && chatRoom.status === ChatRoomStatus.WAITING) {
      chatRoom.status = ChatRoomStatus.ACTIVE;
      if (sendMessageDto.senderEmail) {
        chatRoom.assignedAgentEmail = sendMessageDto.senderEmail;
      }
    }

    return await chatRoom.save();
  }

  // Mark messages as read by user
  async markMessagesAsReadByUser(roomId: string, userEmail: string, userType: 'client' | 'agent', messageIds?: string[]): Promise<ChatRoomDocument> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    let updatedCount = 0;
    
    chatRoom.messages.forEach(message => {
      // If specific messageIds provided, only mark those; otherwise mark all unread messages from the other side
      const shouldMarkAsRead = messageIds ? 
        messageIds.includes(message.messageId) : 
        message.sender !== userType && !message.readBy.some(r => r.userEmail === userEmail);
      
      if (shouldMarkAsRead) {
        // Check if user hasn't already read this message
        if (!message.readBy.some(r => r.userEmail === userEmail)) {
          message.readBy.push({
            userEmail,
            userType,
            readAt: new Date()
          });
          updatedCount++;
        }
        
        // Mark as read if all recipients have read it
        if (userType === 'client' && message.sender === 'agent') {
          message.isRead = true;
        } else if (userType === 'agent' && message.sender === 'client') {
          message.isRead = true;
        }
      }
    });

    // Update notification counts and last read timestamps
    if (userType === 'client') {
      chatRoom.unreadCountForClient = Math.max(0, (chatRoom.unreadCountForClient || 0) - updatedCount);
      chatRoom.lastReadByClient = new Date();
    } else if (userType === 'agent') {
      chatRoom.unreadCountForAgent = Math.max(0, (chatRoom.unreadCountForAgent || 0) - updatedCount);
      chatRoom.lastReadByAgent = new Date();
    }

    return await chatRoom.save();
  }

  // Get unread message count for a specific user
  async getUnreadCountForUser(roomId: string, userEmail: string, userType: 'client' | 'agent'): Promise<number> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    return chatRoom.messages.filter(message => 
      message.sender !== userType && 
      !message.readBy.some(r => r.userEmail === userEmail)
    ).length;
  }

  // Get notification counts for all rooms (for agents)
  async getNotificationCounts(userEmail?: string, userType?: 'client' | 'agent'): Promise<{
    totalUnread: number;
    roomCounts: Array<{ roomId: string; unreadCount: number; clientEmail: string; status: string }>;
  }> {
    const rooms = await this.chatRoomModel.find({}).exec();
    
    let totalUnread = 0;
    const roomCounts: Array<{ roomId: string; unreadCount: number; clientEmail: string; status: string }> = [];
    
    for (const room of rooms) {
      let unreadCount = 0;
      
      if (userType === 'agent') {
        unreadCount = room.unreadCountForAgent || 0;
      } else if (userType === 'client' && room.clientEmail === userEmail) {
        unreadCount = room.unreadCountForClient || 0;
      }
      
      if (unreadCount > 0) {
        roomCounts.push({
          roomId: room.roomId,
          unreadCount,
          clientEmail: room.clientEmail,
          status: room.status
        });
        totalUnread += unreadCount;
      }
    }
    
    return { totalUnread, roomCounts };
  }

  // Reset notification count for a room
  async resetNotificationCount(roomId: string, userType: 'client' | 'agent'): Promise<void> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    if (userType === 'client') {
      chatRoom.unreadCountForClient = 0;
      chatRoom.lastReadByClient = new Date();
    } else if (userType === 'agent') {
      chatRoom.unreadCountForAgent = 0;
      chatRoom.lastReadByAgent = new Date();
    }
    
    await chatRoom.save();
  }

  // Update chat room
  async updateChatRoom(roomId: string, updateChatRoomDto: UpdateChatRoomDto): Promise<ChatRoomDocument> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    if (updateChatRoomDto.status) {
      chatRoom.status = updateChatRoomDto.status;
      if (updateChatRoomDto.status === ChatRoomStatus.CLOSED) {
        chatRoom.closedAt = new Date();
      }
    }

    if (updateChatRoomDto.assignedAgentEmail) {
      chatRoom.assignedAgentEmail = updateChatRoomDto.assignedAgentEmail;
    }

    if (updateChatRoomDto.notes) {
      chatRoom.notes = updateChatRoomDto.notes;
    }

    if (updateChatRoomDto.tags) {
      chatRoom.tags = updateChatRoomDto.tags;
    }

    chatRoom.lastActivity = new Date();
    return await chatRoom.save();
  }

  // Mark messages as read
  async markMessagesAsRead(roomId: string, messageIds: string[]): Promise<ChatRoomDocument> {
    const chatRoom = await this.getChatRoomById(roomId);
    
    chatRoom.messages.forEach(message => {
      if (messageIds.includes(message.messageId)) {
        message.isRead = true;
      }
    });

    return await chatRoom.save();
  }

  // Get unread message count for agent
  async getUnreadMessageCount(agentEmail?: string): Promise<number> {
    const query: any = {
      status: { $in: [ChatRoomStatus.ACTIVE, ChatRoomStatus.WAITING] }
    };

    if (agentEmail) {
      query.assignedAgentEmail = agentEmail;
    }

    const rooms = await this.chatRoomModel.find(query).exec();
    
    let unreadCount = 0;
    rooms.forEach(room => {
      room.messages.forEach(message => {
        if (message.sender === 'client' && !message.isRead) {
          unreadCount++;
        }
      });
    });

    return unreadCount;
  }

  // Get chat room statistics
  async getChatRoomStats(): Promise<any> {
    const [
      totalRooms,
      activeRooms,
      waitingRooms,
      closedRooms,
      totalMessages
    ] = await Promise.all([
      this.chatRoomModel.countDocuments(),
      this.chatRoomModel.countDocuments({ status: ChatRoomStatus.ACTIVE }),
      this.chatRoomModel.countDocuments({ status: ChatRoomStatus.WAITING }),
      this.chatRoomModel.countDocuments({ status: ChatRoomStatus.CLOSED }),
      this.chatRoomModel.aggregate([
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ])
    ]);

    return {
      totalRooms,
      statusBreakdown: {
        active: activeRooms,
        waiting: waitingRooms,
        closed: closedRooms
      },
      totalMessages: totalMessages[0]?.total || 0
    };
  }

  // Delete chat room
  async deleteChatRoom(roomId: string): Promise<void> {
    const result = await this.chatRoomModel.deleteOne({ roomId }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Chat room with ID ${roomId} not found`);
    }
  }
} 