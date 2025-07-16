import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  author: string; // Can be username, email, or "admin", "system"

  @Prop({ default: false })
  isInternal: boolean; // Internal comments only visible to admins

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop()
  userRole?: string; // 'USER', 'ADMIN', 'SUPPORT', etc.

  @Prop({ default: false })
  isSystemMessage: boolean; // For automated messages

  @Prop([String])
  attachments: string[]; // File URLs/paths

  @Prop()
  editedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  editedBy?: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment); 