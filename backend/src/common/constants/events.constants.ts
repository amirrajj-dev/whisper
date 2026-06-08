export const ChatEvents = {
  MESSAGE_SENT: 'chat.message.sent',
  MESSAGE_EDITED: 'chat.message.edited',
  MESSAGE_DELETED: 'chat.message.deleted',
  MESSAGE_READ: 'chat.message.read',
  MESSAGES_READ: 'chat.messages.read',
  CONVERSATION_CREATED: 'chat.conversation.created',
  CONVERSATION_UPDATED: 'chat.conversation.updated',
  CONVERSATION_DELETED: 'chat.conversation.deleted',
  PARTICIPANT_ADDED: 'chat.participant.added',
  PARTICIPANT_REMOVED: 'chat.participant.removed',
  PARTICIPANT_ROLE_CHANGED: 'chat.participant.role.changed',
  OWNERSHIP_TRANSFERRED: 'chat.ownership.transferred',
  TYPING_START: 'chat.typing.start',
  TYPING_STOP: 'chat.typing.stop',
} as const;

export const UserEvents = {
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_UPDATED: 'user.updated',
  USER_BLOCKED: 'user.blocked',
} as const;

export const NotificationEvents = {
  NOTIFICATION_CREATED: 'notification.created',
} as const;
