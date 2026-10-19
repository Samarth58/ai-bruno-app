import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { signAccessToken } from '../auth/jwt.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  requestPasswordReset,
  resendPasswordResetOtp,
  resetPasswordWithToken,
  verifyPasswordResetOtp,
} from '../auth/passwordResetService.js';
import {
  createSession,
  revokeAllSessionsForUser,
  revokeSession,
  rotateSession,
} from '../auth/sessionService.js';
import { db } from '../db/connection.js';
import { authGuard } from '../middleware/authGuard.js';
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

const resendResetOtpSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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

export const forgotPasswordBodySchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Registered user email address to receive 6-digit recovery OTP',
      example: 'lifter@example.com',
    },
  },
};

export const verifyResetOtpBodySchema = {
  type: 'object',
  required: ['email', 'otp'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Registered user email address',
      example: 'lifter@example.com',
    },
    otp: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
      pattern: '^[0-9]{6}$',
      description: 'Six-digit numeric recovery code received by email',
      example: '482910',
    },
  },
};

export const resendResetOtpBodySchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Registered user email address',
      example: 'lifter@example.com',
    },
  },
};

export const resetPasswordBodySchema = {
  type: 'object',
  required: ['resetToken', 'newPassword', 'confirmPassword'],
  properties: {
    resetToken: {
      type: 'string',
      minLength: 1,
      description: 'Single-use password-reset authorization token received after verifying OTP',
      example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    },
    newPassword: {
      type: 'string',
      minLength: 8,
      description: 'New account password (minimum 8 characters)',
      example: 'NewStrongPassword123!',
    },
    confirmPassword: {
      type: 'string',
      minLength: 8,
      description: 'Confirmation of the new password (must match newPassword)',
      example: 'NewStrongPassword123!',
    },
  },
};

export const changePasswordBodySchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword', 'confirmPassword'],
  properties: {
    currentPassword: {
      type: 'string',
      description: 'Current account password for identity verification',
      example: 'CurrentPassword123!',
    },
    newPassword: {
      type: 'string',
      minLength: 8,
      description: 'New account password (minimum 8 characters)',
      example: 'NewStrongPassword456!',
    },
    confirmPassword: {
      type: 'string',
      minLength: 8,
      description: 'Confirmation of the new password (must match newPassword)',
      example: 'NewStrongPassword456!',
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

  // -------------------------------------------------------------------------
  // Password Recovery Flow Endpoints
  // -------------------------------------------------------------------------

  const handleForgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
    }

    await requestPasswordReset(parsed.data.email);

    return reply.status(200).send(
      ok({
        message: 'If an account exists with this email, a verification code has been sent.',
      }),
    );
  };

  app.post(
    '/auth/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Request password reset OTP',
        description:
          'Generates a cryptographically secure 6-digit numeric OTP and sends it via Brevo email. Always returns a generic response to prevent email enumeration.',
        body: forgotPasswordBodySchema,
      },
    },
    handleForgotPassword,
  );

  app.post(
    '/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        hide: true,
      },
    },
    handleForgotPassword,
  );

  const handleVerifyResetOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = verifyResetOtpSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
    }

    const { email, otp } = parsed.data;
    const result = await verifyPasswordResetOtp(email, otp);

    return reply.status(200).send(ok(result));
  };

  app.post(
    '/auth/verify-reset-otp',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Verify password reset OTP',
        description:
          'Validates the 6-digit OTP code against server expiry (5m) and attempts limit (5). Issues a short-lived, single-use password reset authorization token.',
        body: verifyResetOtpBodySchema,
      },
    },
    handleVerifyResetOtp,
  );

  app.post(
    '/verify-reset-otp',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
      schema: {
        hide: true,
      },
    },
    handleVerifyResetOtp,
  );

  const handleResendResetOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = resendResetOtpSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
    }

    const result = await resendPasswordResetOtp(parsed.data.email);

    return reply.status(200).send(
      ok({
        message: 'If an account exists with this email, a new verification code has been sent.',
        cooldownSeconds: result?.cooldownSeconds ?? 60,
      }),
    );
  };

  app.post(
    '/auth/resend-reset-otp',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Resend password reset OTP',
        description:
          'Invalidates previous OTP and issues a fresh code, subject to 60-second cooldown and rate limiting. Returns generic success to protect account privacy.',
        body: resendResetOtpBodySchema,
      },
    },
    handleResendResetOtp,
  );

  app.post(
    '/resend-reset-otp',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        hide: true,
      },
    },
    handleResendResetOtp,
  );

  const handleResetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
    }

    const { resetToken, newPassword } = parsed.data;
    await resetPasswordWithToken(resetToken, newPassword);

    return reply.status(200).send(
      ok({
        message: 'Password has been reset successfully. Please sign in with your new password.',
      }),
    );
  };

  app.post(
    '/auth/reset-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Set new password with reset authorization token',
        description:
          'Validates the single-use authorization token, verifies password confirmation, hashes with Argon2id, atomically consumes token, and revokes all active sessions.',
        body: resetPasswordBodySchema,
      },
    },
    handleResetPassword,
  );

  app.post(
    '/reset-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        hide: true,
      },
    },
    handleResetPassword,
  );

  // -------------------------------------------------------------------------
  // Authenticated Change Password Endpoint
  // -------------------------------------------------------------------------

  const handleChangePassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = changePasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
    }

    const { currentPassword, newPassword } = parsed.data;
    const userId = request.userId!;

    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return reply
        .status(401)
        .send(fail('UNAUTHORIZED', 'Unauthorized', []));
    }

    const isValid = await verifyPassword(user.passwordHash, currentPassword);
    if (!isValid) {
      return reply.status(400).send(
        fail('VALIDATION_ERROR', 'Incorrect current password', [
          {
            code: 'custom',
            path: ['currentPassword'],
            message: 'Incorrect current password',
          },
        ]),
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    await revokeAllSessionsForUser(userId);

    return reply.status(200).send(
      ok({
        message: 'Password changed successfully. Please sign in again with your new password.',
      }),
    );
  };

  app.post(
    '/auth/change-password',
    {
      preHandler: authGuard,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Change password for authenticated user',
        description:
          'Verifies current password with Argon2id, hashes new password, updates user credentials, and revokes all active refresh sessions.',
        security: [{ bearerAuth: [] }],
        body: changePasswordBodySchema,
      },
    },
    handleChangePassword,
  );

  app.post(
    '/change-password',
    {
      preHandler: authGuard,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60000,
        },
      },
      schema: {
        hide: true,
      },
    },
    handleChangePassword,
  );
}
