import type { Request } from 'express';
import type { User } from './user.type';

export type AuthRequest = Request & {
  user: Omit<User, 'password'>;
};
