import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Ticket,
  TicketCategory,
  TicketDocument,
  TicketPriority,
  TicketStatus,
} from './schemas/ticket.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateTicketDto, CreateCommentDto, UpdateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  // Generate unique ticket ID
  private generateTicketId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `TK${timestamp}${random}`;
  }

  // Create a new ticket
  async createTicket(createTicketDto: CreateTicketDto): Promise<TicketDocument> {
    const ticketId = this.generateTicketId();
    
    const ticketData = {
      ...createTicketDto,
      ticketId,
      isAnonymous: true, // All tickets are anonymous for now
      lastUpdated: new Date(),
    };

    const ticket = new this.ticketModel(ticketData);
    const savedTicket = await ticket.save();

    // Create initial comment with the ticket message
    await this.addComment(savedTicket.ticketId, {
      message: createTicketDto.message,
      author: createTicketDto.anonymousName || createTicketDto.anonymousEmail || 'Anonymous',
    });

    const populatedTicket = await this.ticketModel.findById(savedTicket._id).populate('comments').exec();
    if (!populatedTicket) {
      throw new NotFoundException('Failed to retrieve created ticket');
    }
    
    return populatedTicket;
  }

  // Get ticket by ID
  async getTicketById(ticketId: string): Promise<TicketDocument> {
    const ticket = await this.ticketModel
      .findOne({ ticketId })
      .populate('comments')
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return ticket;
  }

  // Add comment to ticket
  async addComment(ticketId: string, createCommentDto: CreateCommentDto): Promise<CommentDocument> {
    const ticket = await this.ticketModel.findOne({ ticketId });
    
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const comment = new this.commentModel({
      ...createCommentDto,
      ticketId: ticket._id,
      createdAt: new Date(),
    });

    const savedComment = await comment.save();

    // Add comment to ticket
    await this.ticketModel.findByIdAndUpdate(
      ticket._id,
      { 
        $push: { comments: savedComment._id },
        lastUpdated: new Date()
      }
    );

    return savedComment;
  }

  // Get ticket comments
  async getTicketComments(ticketId: string): Promise<CommentDocument[]> {
    const ticket = await this.ticketModel
      .findOne({ ticketId })
      .populate('comments')
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // When populated, comments becomes CommentDocument[]
    return (ticket.comments as unknown) as CommentDocument[];
  }

  // Get all tickets with pagination and filters
  async getAllTickets(
    page = 1, 
    limit = 10, 
    status?: TicketStatus,
    priority?: TicketPriority,
    category?: TicketCategory
  ): Promise<{ tickets: TicketDocument[], total: number }> {
    const filter: any = {};
    
    if (typeof status === 'string' && Object.values(TicketStatus).includes(status)) {
      filter.status = { $eq: status };
    }
    if (typeof priority === 'string' && Object.values(TicketPriority).includes(priority)) {
      filter.priority = { $eq: priority };
    }
    if (typeof category === 'string' && Object.values(TicketCategory).includes(category)) {
      filter.category = { $eq: category };
    }

    const skip = (page - 1) * limit;
    
    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('comments')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ticketModel.countDocuments(filter)
    ]);

    return { tickets, total };
  }

  // Update ticket
  async updateTicket(ticketId: string, updateTicketDto: UpdateTicketDto): Promise<TicketDocument> {
    const update: Record<string, unknown> = { lastUpdated: new Date() };
    if (typeof updateTicketDto.subject === 'string') update.subject = updateTicketDto.subject;
    if (updateTicketDto.category) update.category = updateTicketDto.category;
    if (updateTicketDto.priority) update.priority = updateTicketDto.priority;
    if (updateTicketDto.status) update.status = updateTicketDto.status;
    if (typeof updateTicketDto.assignedTo === 'string') update.assignedTo = updateTicketDto.assignedTo;

    const ticket = await this.ticketModel.findOneAndUpdate(
      { ticketId },
      { $set: update },
      { new: true }
    ).populate('comments');

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return ticket;
  }

  // Delete ticket
  async deleteTicket(ticketId: string): Promise<void> {
    const ticket = await this.ticketModel.findOne({ ticketId });
    
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Delete all comments associated with the ticket
    await this.commentModel.deleteMany({ ticketId: ticket._id });
    
    // Delete the ticket
    await this.ticketModel.findByIdAndDelete(ticket._id);
  }

  // Get admin statistics
  async getAdminStats(): Promise<any> {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      highPriorityTickets,
      mediumPriorityTickets,
      lowPriorityTickets
    ] = await Promise.all([
      this.ticketModel.countDocuments(),
      this.ticketModel.countDocuments({ status: TicketStatus.OPEN }),
      this.ticketModel.countDocuments({ status: TicketStatus.IN_PROGRESS }),
      this.ticketModel.countDocuments({ status: TicketStatus.RESOLVED }),
      this.ticketModel.countDocuments({ status: TicketStatus.CLOSED }),
      this.ticketModel.countDocuments({ priority: 'HIGH' }),
      this.ticketModel.countDocuments({ priority: 'MEDIUM' }),
      this.ticketModel.countDocuments({ priority: 'LOW' })
    ]);

    return {
      totalTickets,
      statusBreakdown: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      priorityBreakdown: {
        high: highPriorityTickets,
        medium: mediumPriorityTickets,
        low: lowPriorityTickets
      }
    };
  }
}
