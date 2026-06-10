export type { User, PopulatedUser } from './entities/user';
export type { Conversation, ConversationType } from './entities/conversation';
export type { Message, MessageType, ReplyPreview } from './entities/message';
export type { Notification, NotificationType } from './entities/notification';
export type { LoginDto, SignupDto, AuthResponse, RefreshResponse } from './dto/auth';
export type {
  CreateConversationDto,
  SendMessageDto,
  EditMessageDto,
  AddParticipantsDto,
  UpdateConversationDto,
  TransferOwnershipDto,
} from './dto/chat';
export type { UpdateUserDto } from './dto/user';
export type { PaginationDto } from './dto/pagination';
export type {
  ConversationListResponse,
  MessageListResponse,
  NotificationListResponse,
  UserListResponse,
  UnreadCountResponse,
  BatchOnlineStatusResponse,
  ApiError,
} from './api/responses';
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  MessageNewPayload,
  MessageEditedPayload,
  MessageDeletedPayload,
  ConnectedPayload,
} from './socket/events';
