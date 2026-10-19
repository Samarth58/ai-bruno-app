import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { signAccessToken } from '../auth/jwt.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  createSession,
  revokeSession,
  rotateSession,
} from '../auth/sessionService.js';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { fail, ok } from '../utils/response.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

function toUserResponse(user: {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.createdAt.toISOString(),
  };
}

export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Unique email address for user registration',
      example: 'lifter@example.com',
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'Account password (minimum 8 characters)',
      example: 'StrongPassword123!',
    },
    name: {
      type: 'string',
      description: 'Optional display name of the lifter',
      example: 'Bruno Lifter',
    },
  },
};

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Registered user email address',
      example: 'lifter@example.com',
    },
    password: {
      type: 'string',
      description: 'Account password',
      example: 'StrongPassword123!',
    },
  },
};

export const refreshTokenBodySchema = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
      minLength: 1,
      description: 'Valid, unrevoked JWT refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJqdGkiOiJtb2NrLWp0aSIsInR5cCI6InJlZnJlc2gifQ.mock_signature',
    },
  },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with hashed password and returns access/refresh tokens.',
        body: registerBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      const { email, password, name } = parsed.data;

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (existing.length > 0) {
        return reply
          .status(409)
          .send(fail('CONFLICT', 'Email already registered', []));
      }

      const passwordHash = await hashPassword(password);

      const [user] = await db
        .insert(users)
        .values({ email, passwordHash, name: name ?? null, role: 'user' })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
        });

      const token = signAccessToken(user.id);
      const { refreshToken } = await createSession(user.id);

      return reply.status(201).send(
        ok({
          user: toUserResponse(user),
          token,
          refreshToken,
        }),
      );
    },
  );

  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'User login',
        description: 'Authenticates email/password credentials and issues a fresh token pair.',
        body: loginBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      const { email, password } = parsed.data;

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          passwordHash: users.passwordHash,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        return reply
          .status(401)
          .send(fail('UNAUTHORIZED', 'Invalid email or password', []));
      }

      const isValid = await verifyPassword(user.passwordHash, password);

      if (!isValid) {
        return reply
          .status(401)
          .send(fail('UNAUTHORIZED', 'Invalid email or password', []));
      }

      const token = signAccessToken(user.id);
      const { refreshToken } = await createSession(user.id);

      return reply.status(200).send(
        ok({
          user: toUserResponse(user),
          token,
          refreshToken,
        }),
      );
    },
  );

  app.post(
    '/refresh',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Refresh token rotation',
        description: 'Rotates an active refresh token with single-use replay protection and 20s grace window.',
        body: refreshTokenBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = refreshTokenSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      const result = await rotateSession(parsed.data.refreshToken);

      return reply.status(200).send(
        ok({
          token: result.accessToken,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      );
    },
  );

  app.post(
    '/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'User logout',
        description: 'Revokes the active refresh token session in the database.',
        body: refreshTokenBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = refreshTokenSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      await revokeSession(parsed.data.refreshToken);

      return reply.status(200).send(ok({ success: true }));
    },
  );
}
