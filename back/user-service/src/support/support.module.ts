import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema';
import { ChatRoomController } from './chat-room.controller';
import { ChatRoomService } from './chat-room.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
    ]),
  ],
  controllers: [SupportController, ChatRoomController],
  providers: [SupportService, ChatRoomService, ChatGateway],
  exports: [SupportService, ChatRoomService, ChatGateway],
})
export class SupportModule {} 