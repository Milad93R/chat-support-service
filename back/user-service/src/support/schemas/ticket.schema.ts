import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ANSWERED = 'answered',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  GENERAL_INQUIRY = 'general-inquiry',
  TECHNICAL_SUPPORT = 'technical-support',
  ACCOUNT_ISSUE = 'account-issue',
  TRADING_ISSUE = 'trading-issue',
  BILLING = 'billing',
  BUG_REPORT = 'bug-report',
  FEATURE_REQUEST = 'feature-request',
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: TicketCategory, default: TicketCategory.GENERAL_INQUIRY })
  category: TicketCategory;

  @Prop({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop()
  anonymousEmail?: string;

  @Prop()
  anonymousName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'Comment' }])
  comments: Types.ObjectId[];

  @Prop({ default: Date.now })
  lastUpdated: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop({ default: false })
  isInternal: boolean;

  @Prop([String])
  tags: string[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket); 