export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:4000';

export const PAGINATION = {
  CONVERSATIONS: 20,
  MESSAGES: 50,
  NOTIFICATIONS: 20,
  USERS: 20,
};

export const MESSAGE_MAX_LENGTH = 4000;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const BIO_MAX_LENGTH = 70;
export const GROUP_NAME_MAX_LENGTH = 100;
export const FILE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
export const TYPING_TIMEOUT = 2000;

export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
  'application/pdf',
  'text/plain',
];
