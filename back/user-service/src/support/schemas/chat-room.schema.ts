import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

export enum ChatRoomStatus {
  ACTIVE = 'active',
  WAITING = 'waiting',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop()
  clientName?: string;

  @Prop({ enum: ChatRoomStatus, default: ChatRoomStatus.WAITING })
  status: ChatRoomStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedAgent?: Types.ObjectId;

  @Prop()
  assignedAgentEmail?: string;

  @Prop([{
    messageId: { type: String, required: true },
    content: { type: String, required: true },
    sender: { type: String, enum: ['client', 'agent'], required: true },
    senderEmail: { type: String },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    readBy: [{
      userEmail: { type: String, required: true },
      userType: { type: String, enum: ['client', 'agent'], required: true },
      readAt: { type: Date, default: Date.now }
    }]
  }])
  messages: Array<{
    messageId: string;
    content: string;
    sender: 'client' | 'agent';
    senderEmail?: string;
    timestamp: Date;
    isRead: boolean;
    readBy: Array<{
      userEmail: string;
      userType: 'client' | 'agent';
      readAt: Date;
    }>;
  }>;

  @Prop({ default: Date.now })
  lastActivity: Date;

  @Prop()
  closedAt?: Date;

  @Prop()
  closedBy?: string;

  @Prop([String])
  tags: string[];

  @Prop()
  notes?: string;

  // Notification counts
  @Prop({ default: 0 })
  unreadCountForClient: number;

  @Prop({ default: 0 })
  unreadCountForAgent: number;

  @Prop()
  lastReadByClient?: Date;

  @Prop()
  lastReadByAgent?: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom); 