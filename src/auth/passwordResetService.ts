import crypto from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { FastifyError } from 'fastify';
import { env } from '../config/env.js';
import { db } from '../db/connection.js';
import { passwordResetChallenges, users, userSessions } from '../db/schema.js';
import { sendPasswordResetOtpEmail } from './emailService.js';
import { hashPassword } from './password.js';

function createValidationError(message: string, details: unknown[] = []): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  (error as unknown as { details: unknown[] }).details = details;
  return error;
}

function createRateLimitError(message: string, retryAfterSeconds: number): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 429;
  error.code = 'RATE_LIMIT_EXCEEDED';
  (error as unknown as { details: unknown[] }).details = [{ retryAfterSeconds }];
  return error;
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP with leading zeros.
 */
export function generateOtp(): string {
  const otpInt = crypto.randomInt(0, 1000000);
  return otpInt.toString().padStart(6, '0');
}

/**
 * Produces a SHA-256 hexadecimal hash string for safe OTP and token storage.
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Constant-time comparison between two hex-encoded hashes to prevent timing attacks.
 */
export function safeCompareHash(candidateHex: string, targetHex: string): boolean {
  try {
    const bufA = Buffer.from(candidateHex, 'hex');
    const bufB = Buffer.from(targetHex, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Requests a password reset OTP for the given email address.
 * Emits a generic response without revealing whether the account exists.
 * Dispatches an email via Brevo if the account exists and cooldown allows.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    // Account does not exist. Perform a dummy hash calculation to maintain consistent timing.
    hashSecret(`dummy-timing-salt-${normalizedEmail}`);
    return;
  }

  const [activeChallenge] = await db
    .select()
    .from(passwordResetChallenges)
    .where(
      and(
        eq(passwordResetChallenges.userId, user.id),
        isNull(passwordResetChallenges.consumedAt),
        isNull(passwordResetChallenges.supersededAt),
      ),
    )
    .orderBy(desc(passwordResetChallenges.createdAt))
    .limit(1);

  const now = new Date();

  // If an active challenge is still within its resend cooldown, do not spam emails or re-generate OTP.
  // Return silently to preserve generic response without throwing.
  if (activeChallenge && activeChallenge.resendCooldownExpiresAt.getTime() > now.getTime()) {
    return;
  }

  // If previous challenge exists and cooldown has expired, invalidate previous challenge
  if (activeChallenge) {
    await db
      .update(passwordResetChallenges)
      .set({ supersededAt: now, updatedAt: now })
      .where(eq(passwordResetChallenges.id, activeChallenge.id));
  }

  const otp = generateOtp();
  const otpHash = hashSecret(otp);

  const ttlMinutes = env.PASSWORD_RESET_OTP_TTL_MINUTES ?? 5;
  const cooldownSeconds = env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS ?? 60;
  const maxAttempts = env.PASSWORD_RESET_OTP_MAX_ATTEMPTS ?? 5;

  const otpExpiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const resendCooldownExpiresAt = new Date(now.getTime() + cooldownSeconds * 1000);

  await db.insert(passwordResetChallenges).values({
    userId: user.id,
    email: normalizedEmail,
    otpHash,
    otpExpiresAt,
    resendCooldownExpiresAt,
    maxAttempts,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Dispatch email safely via Brevo (swallows errors internally)
  await sendPasswordResetOtpEmail(normalizedEmail, otp, ttlMinutes);
}

/**
 * Resends a password reset OTP for the given email address.
 * Invalidate previous challenge, enforces cooldown, and prevents user enumeration.
 */
export async function resendPasswordResetOtp(
  email: string,
): Promise<{ cooldownSeconds: number } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
    .limit(1);

  const cooldownSeconds = env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS ?? 60;

  if (!user) {
    hashSecret(`dummy-timing-salt-${normalizedEmail}`);
    return null;
  }

  const [activeChallenge] = await db
    .select()
    .from(passwordResetChallenges)
    .where(
      and(
        eq(passwordResetChallenges.userId, user.id),
        isNull(passwordResetChallenges.consumedAt),
        isNull(passwordResetChallenges.supersededAt),
      ),
    )
    .orderBy(desc(passwordResetChallenges.createdAt))
    .limit(1);

  const now = new Date();

  if (activeChallenge && activeChallenge.resendCooldownExpiresAt.getTime() > now.getTime()) {
    const remainingSeconds = Math.ceil(
      (activeChallenge.resendCooldownExpiresAt.getTime() - now.getTime()) / 1000,
    );
    throw createRateLimitError(
      `Please wait ${remainingSeconds} second(s) before requesting a new verification code.`,
      remainingSeconds,
    );
  }

  // Invalidate previous challenge
  if (activeChallenge) {
    await db
      .update(passwordResetChallenges)
      .set({ supersededAt: now, updatedAt: now })
      .where(eq(passwordResetChallenges.id, activeChallenge.id));
  }

  const otp = generateOtp();
  const otpHash = hashSecret(otp);
  const ttlMinutes = env.PASSWORD_RESET_OTP_TTL_MINUTES ?? 5;
  const maxAttempts = env.PASSWORD_RESET_OTP_MAX_ATTEMPTS ?? 5;

  const otpExpiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const resendCooldownExpiresAt = new Date(now.getTime() + cooldownSeconds * 1000);

  await db.insert(passwordResetChallenges).values({
    userId: user.id,
    email: normalizedEmail,
    otpHash,
    otpExpiresAt,
    resendCooldownExpiresAt,
    maxAttempts,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  await sendPasswordResetOtpEmail(normalizedEmail, otp, ttlMinutes);

  return { cooldownSeconds };
}

/**
 * Verifies a 6-digit OTP code against the user's active challenge.
 * Enforces TTL expiry, attempt limit (5), unused status, and constant-time comparison.
 * On success, issues a single-use password-reset authorization token.
 */
export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<{ resetToken: string; expiresInSeconds: number }> {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw createValidationError('Invalid or expired verification code');
  }

  const [challenge] = await db
    .select()
    .from(passwordResetChallenges)
    .where(
      and(
        eq(passwordResetChallenges.userId, user.id),
        isNull(passwordResetChallenges.consumedAt),
        isNull(passwordResetChallenges.supersededAt),
      ),
    )
    .orderBy(desc(passwordResetChallenges.createdAt))
    .limit(1);

  if (!challenge) {
    throw createValidationError('Invalid or expired verification code');
  }

  // Do not allow an already-verified OTP to be verified again
  if (challenge.otpVerifiedAt !== null) {
    throw createValidationError(
      'Verification code has already been verified. Please proceed to create your new password.',
    );
  }

  const now = new Date();

  // Enforce server-side 5-minute expiry
  if (challenge.otpExpiresAt.getTime() <= now.getTime()) {
    await db
      .update(passwordResetChallenges)
      .set({ supersededAt: now, updatedAt: now })
      .where(eq(passwordResetChallenges.id, challenge.id));
    throw createValidationError('Verification code has expired. Please request a new code.');
  }

  // Enforce 5 verification attempts limit
  if (challenge.attempts >= challenge.maxAttempts) {
    await db
      .update(passwordResetChallenges)
      .set({ supersededAt: now, updatedAt: now })
      .where(eq(passwordResetChallenges.id, challenge.id));
    throw createValidationError(
      'Maximum verification attempts exceeded. Please request a new verification code.',
    );
  }

  const candidateHash = hashSecret(otp.trim());
  const isValid = safeCompareHash(candidateHash, challenge.otpHash);

  if (!isValid) {
    const newAttempts = challenge.attempts + 1;
    const remaining = Math.max(0, challenge.maxAttempts - newAttempts);

    await db
      .update(passwordResetChallenges)
      .set({
        attempts: newAttempts,
        updatedAt: now,
        ...(remaining === 0 ? { supersededAt: now } : {}),
      })
      .where(eq(passwordResetChallenges.id, challenge.id));

    if (remaining === 0) {
      throw createValidationError(
        'Maximum verification attempts exceeded. Please request a new verification code.',
      );
    }

    throw createValidationError(`Invalid verification code. ${remaining} attempt(s) remaining.`);
  }

  // Issue short-lived, single-use password-reset authorization token (15 min validity)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = hashSecret(resetToken);
  const resetTokenExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  await db
    .update(passwordResetChallenges)
    .set({
      otpVerifiedAt: now,
      resetTokenHash,
      resetTokenExpiresAt,
      updatedAt: now,
    })
    .where(eq(passwordResetChallenges.id, challenge.id));

  return {
    resetToken,
    expiresInSeconds: 15 * 60,
  };
}

/**
 * Consumes the single-use password-reset authorization token, hashes the new password with Argon2id,
 * updates user credentials, and revokes all active user refresh sessions.
 * Atomic transaction with FOR UPDATE locks ensures no concurrent double-spend.
 */
export async function resetPasswordWithToken(
  resetToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashSecret(resetToken.trim());

  await db.transaction(async (tx) => {
    const [challenge] = await tx
      .select()
      .from(passwordResetChallenges)
      .where(eq(passwordResetChallenges.resetTokenHash, tokenHash))
      .for('update')
      .limit(1);

    if (
      !challenge ||
      challenge.consumedAt !== null ||
      challenge.supersededAt !== null ||
      challenge.otpVerifiedAt === null
    ) {
      throw createValidationError('Invalid or already consumed password reset token');
    }

    const now = new Date();

    if (!challenge.resetTokenExpiresAt || challenge.resetTokenExpiresAt.getTime() <= now.getTime()) {
      throw createValidationError('Password reset token has expired. Please restart recovery.');
    }

    const [user] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, challenge.userId), isNull(users.deletedAt)))
      .for('update')
      .limit(1);

    if (!user) {
      throw createValidationError('User not found or account deactivated');
    }

    // Hash new password using Bruno's Argon2id implementation
    const newPasswordHash = await hashPassword(newPassword);

    // Atomically update user's password
    await tx
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    // Atomically consume authorization token so it cannot be reused
    await tx
      .update(passwordResetChallenges)
      .set({
        consumedAt: now,
        updatedAt: now,
      })
      .where(eq(passwordResetChallenges.id, challenge.id));

    // Invalidate any other pending challenges for this user
    await tx
      .update(passwordResetChallenges)
      .set({
        supersededAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(passwordResetChallenges.userId, user.id),
          isNull(passwordResetChallenges.consumedAt),
          isNull(passwordResetChallenges.supersededAt),
        ),
      );

    // Revoke all existing sessions for this user using current session model
    await tx
      .update(userSessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(userSessions.userId, user.id),
          isNull(userSessions.revokedAt),
        ),
      );
  });
}
