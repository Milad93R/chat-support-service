import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto, CreateCommentDto, UpdateTicketDto } from './dto/create-ticket.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Create new ticket (anonymous)
  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    try {
      const ticket = await this.supportService.createTicket(createTicketDto);
      return {
        success: true,
        data: ticket,
        message: 'Ticket created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create ticket'
      };
    }
  }

  // Get all tickets (for admin)
  @Get('tickets')
  async getAllTickets(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string
  ) {
    try {
      const tickets = await this.supportService.getAllTickets(
        Number(page),
        Number(limit),
        status,
        priority,
        category
      );
      return {
        success: true,
        data: tickets,
        message: 'Tickets retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve tickets'
      };
    }
  }

  // Get ticket by ID
  @Get('tickets/:ticketId')
  async getTicketById(@Param('ticketId') ticketId: string) {
    try {
      const ticket = await this.supportService.getTicketById(ticketId);
      return {
        success: true,
        data: ticket,
        message: 'Ticket retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve ticket'
      };
    }
  }

  // Update ticket
  @Put('tickets/:ticketId')
  async updateTicket(
    @Param('ticketId') ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto
  ) {
    try {
      const ticket = await this.supportService.updateTicket(ticketId, updateTicketDto);
      return {
        success: true,
        data: ticket,
        message: 'Ticket updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update ticket'
      };
    }
  }

  // Delete ticket
  @Delete('tickets/:ticketId')
  async deleteTicket(@Param('ticketId') ticketId: string) {
    try {
      await this.supportService.deleteTicket(ticketId);
      return {
        success: true,
        message: 'Ticket deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete ticket'
      };
    }
  }

  // Add comment to ticket
  @Post('tickets/:ticketId/comments')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('ticketId') ticketId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    try {
      const comment = await this.supportService.addComment(ticketId, createCommentDto);
      return {
        success: true,
        data: comment,
        message: 'Comment added successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add comment'
      };
    }
  }

  // Get ticket comments
  @Get('tickets/:ticketId/comments')
  async getTicketComments(@Param('ticketId') ticketId: string) {
    try {
      const comments = await this.supportService.getTicketComments(ticketId);
      return {
        success: true,
        data: comments,
        message: 'Comments retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve comments'
      };
    }
  }

  // Get admin statistics
  @Get('admin/stats')
  async getAdminStats() {
    try {
      const stats = await this.supportService.getAdminStats();
      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve statistics'
      };
    }
  }
} 