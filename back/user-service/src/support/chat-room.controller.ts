import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { CreateChatRoomDto, SendMessageDto, UpdateChatRoomDto, GetChatRoomsDto } from './dto/chat-room.dto';

@Controller('chat-rooms')
export class ChatRoomController {
  constructor(private readonly chatRoomService: ChatRoomService) {}

  @Post()
  async createChatRoom(@Body() createChatRoomDto: CreateChatRoomDto) {
    try {
      const chatRoom = await this.chatRoomService.createChatRoom(createChatRoomDto);
      return {
        success: true,
        data: chatRoom,
        message: 'Chat room created successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create chat room',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async getChatRooms(@Query() filters: GetChatRoomsDto) {
    try {
      const result = await this.chatRoomService.getChatRooms(filters);
      return {
        success: true,
        data: result,
        message: 'Chat rooms retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve chat rooms',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':roomId')
  async getChatRoomById(@Param('roomId') roomId: string) {
    try {
      const chatRoom = await this.chatRoomService.getChatRoomById(roomId);
      return {
        success: true,
        data: chatRoom,
        message: 'Chat room retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve chat room',
          error: error.message
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('client/:clientEmail')
  async getChatRoomByClientEmail(@Param('clientEmail') clientEmail: string) {
    try {
      const chatRoom = await this.chatRoomService.getChatRoomByClientEmail(clientEmail);
      return {
        success: true,
        data: chatRoom,
        message: chatRoom ? 'Chat room found' : 'No chat room found for this client'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve chat room',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('client/:clientEmail/recent')
  async getMostRecentChatRoomByClientEmail(@Param('clientEmail') clientEmail: string) {
    try {
      const chatRoom = await this.chatRoomService.getMostRecentChatRoomByClientEmail(clientEmail);
      const canCreateNew = await this.chatRoomService.canClientCreateNewRoom(clientEmail);
      
      return {
        success: true,
        data: {
          room: chatRoom,
          canCreateNewRoom: canCreateNew
        },
        message: chatRoom ? 'Most recent chat room found' : 'No chat room found for this client'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve chat room',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('client/:clientEmail/history')
  async getAllChatRoomsForClient(@Param('clientEmail') clientEmail: string) {
    try {
      const chatRooms = await this.chatRoomService.getAllChatRoomsForClient(clientEmail);
      return {
        success: true,
        data: chatRooms,
        message: 'Chat history retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve chat history',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':roomId/messages')
  async sendMessage(@Param('roomId') roomId: string, @Body() sendMessageDto: SendMessageDto) {
    try {
      const chatRoom = await this.chatRoomService.sendMessage(roomId, sendMessageDto);
      return {
        success: true,
        data: chatRoom,
        message: 'Message sent successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to send message',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':roomId')
  async updateChatRoom(@Param('roomId') roomId: string, @Body() updateChatRoomDto: UpdateChatRoomDto) {
    try {
      const chatRoom = await this.chatRoomService.updateChatRoom(roomId, updateChatRoomDto);
      return {
        success: true,
        data: chatRoom,
        message: 'Chat room updated successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update chat room',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':roomId/messages/read')
  async markMessagesAsRead(
    @Param('roomId') roomId: string,
    @Body() body: { userEmail: string; userType: 'client' | 'agent'; messageIds?: string[] }
  ) {
    try {
      const chatRoom = await this.chatRoomService.markMessagesAsReadByUser(
        roomId,
        body.userEmail,
        body.userType,
        body.messageIds
      );
      return {
        success: true,
        data: chatRoom,
        message: 'Messages marked as read successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to mark messages as read',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':roomId/unread-count')
  async getUnreadCount(
    @Param('roomId') roomId: string,
    @Query('userEmail') userEmail: string,
    @Query('userType') userType: 'client' | 'agent'
  ) {
    try {
      const count = await this.chatRoomService.getUnreadCountForUser(roomId, userEmail, userType);
      return {
        success: true,
        data: { unreadCount: count },
        message: 'Unread count retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get unread count',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('notifications/counts')
  async getNotificationCounts(
    @Query('userEmail') userEmail?: string,
    @Query('userType') userType?: 'client' | 'agent'
  ) {
    try {
      const counts = await this.chatRoomService.getNotificationCounts(userEmail, userType);
      return {
        success: true,
        data: counts,
        message: 'Notification counts retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get notification counts',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':roomId/notifications/reset')
  async resetNotificationCount(
    @Param('roomId') roomId: string,
    @Body() body: { userType: 'client' | 'agent' }
  ) {
    try {
      await this.chatRoomService.resetNotificationCount(roomId, body.userType);
      return {
        success: true,
        message: 'Notification count reset successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to reset notification count',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('unread/count')
  async getUnreadMessageCount(@Query('agentEmail') agentEmail?: string) {
    try {
      const count = await this.chatRoomService.getUnreadMessageCount(agentEmail);
      return {
        success: true,
        data: { unreadCount: count },
        message: 'Unread message count retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get unread message count',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('stats/overview')
  async getChatRoomStats() {
    try {
      const stats = await this.chatRoomService.getChatRoomStats();
      return {
        success: true,
        data: stats,
        message: 'Chat room statistics retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get chat room statistics',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':roomId')
  async deleteChatRoom(@Param('roomId') roomId: string) {
    try {
      await this.chatRoomService.deleteChatRoom(roomId);
      return {
        success: true,
        message: 'Chat room deleted successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete chat room',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 