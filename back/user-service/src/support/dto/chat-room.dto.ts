import { IsNotEmpty, IsString, IsEnum, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ChatRoomStatus } from '../schemas/chat-room.schema';

export class CreateChatRoomDto {
  @IsNotEmpty()
  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(['client', 'agent'])
  sender: 'client' | 'agent';

  @IsOptional()
  @IsEmail()
  senderEmail?: string;
}

export class UpdateChatRoomDto {
  @IsOptional()
  @IsEnum(ChatRoomStatus)
  status?: ChatRoomStatus;

  @IsOptional()
  @IsEmail()
  assignedAgentEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class GetChatRoomsDto {
  @IsOptional()
  @IsEnum(ChatRoomStatus)
  status?: ChatRoomStatus;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  assignedAgentEmail?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
} 