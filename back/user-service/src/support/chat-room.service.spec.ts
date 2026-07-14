import { BadRequestException } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomStatus } from './schemas/chat-room.schema';

describe('ChatRoomService state transitions', () => {
  let service: ChatRoomService;

  beforeEach(() => {
    service = new ChatRoomService({} as never);
  });

  it('activates a waiting room when an agent sends the first reply', async () => {
    const room = {
      status: ChatRoomStatus.WAITING,
      messages: [],
      unreadCountForClient: 0,
      save: jest.fn().mockImplementation(function () { return this; }),
    } as any;
    jest.spyOn(service, 'getChatRoomById').mockResolvedValue(room);

    const result = await service.sendMessage('ROOM-1', {
      content: 'How can I help?',
      sender: 'agent',
      senderEmail: 'agent@example.com',
    });

    expect(result.status).toBe(ChatRoomStatus.ACTIVE);
    expect(result.assignedAgentEmail).toBe('agent@example.com');
    expect(result.unreadCountForClient).toBe(1);
    expect(result.messages).toEqual([
      expect.objectContaining({ content: 'How can I help?', sender: 'agent', isRead: false }),
    ]);
    expect(room.save).toHaveBeenCalledTimes(1);
  });

  it('does not allow messages in a closed room', async () => {
    jest.spyOn(service, 'getChatRoomById').mockResolvedValue({
      status: ChatRoomStatus.CLOSED,
    } as any);

    await expect(service.sendMessage('ROOM-1', {
      content: 'late message',
      sender: 'client',
      senderEmail: 'client@example.com',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks only unread messages from the other side and updates the counter', async () => {
    const room = {
      messages: [
        { messageId: 'client-1', sender: 'client', isRead: false, readBy: [] },
        { messageId: 'agent-1', sender: 'agent', isRead: false, readBy: [] },
      ],
      unreadCountForAgent: 1,
      save: jest.fn().mockImplementation(function () { return this; }),
    } as any;
    jest.spyOn(service, 'getChatRoomById').mockResolvedValue(room);

    const result = await service.markMessagesAsReadByUser(
      'ROOM-1',
      'agent@example.com',
      'agent',
    );

    expect(result.messages[0].isRead).toBe(true);
    expect(result.messages[0].readBy).toEqual([
      expect.objectContaining({ userEmail: 'agent@example.com', userType: 'agent' }),
    ]);
    expect(result.messages[1].readBy).toHaveLength(0);
    expect(result.unreadCountForAgent).toBe(0);
  });

  it('aggregates notification counts only for rooms visible to the caller', async () => {
    const model = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { roomId: 'A', clientEmail: 'a@example.com', status: 'active', unreadCountForClient: 2 },
          { roomId: 'B', clientEmail: 'b@example.com', status: 'active', unreadCountForClient: 5 },
        ]),
      }),
    };
    service = new ChatRoomService(model as never);

    await expect(service.getNotificationCounts('a@example.com', 'client')).resolves.toEqual({
      totalUnread: 2,
      roomCounts: [
        { roomId: 'A', clientEmail: 'a@example.com', status: 'active', unreadCount: 2 },
      ],
    });
  });
});
