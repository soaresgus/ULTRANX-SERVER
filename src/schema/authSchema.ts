import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  surname: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  surname: z.string().min(1),
  passwordHash: z.string().min(1),
  nameWithSurname: z.string().optional(),
  userKey: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sessions: z.array(z.string()).optional(), // Relacionamento com Session
});

export const SessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenExpiresAt: z.date(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
