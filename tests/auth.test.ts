import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { signAccessToken } from '../src/auth/jwt.js';
import { hashPassword } from '../src/auth/password.js';
import { createSession } from '../src/auth/sessionService.js';
import { db } from '../src/db/connection.js';
import { users } from '../src/db/schema.js';

const app = buildApp();
const password = 'password123';

const uniqueEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

async function createAuthTestUser(customEmail?: string, customPassword = password) {
  const email = customEmail ?? uniqueEmail();
  const passwordHash = await hashPassword(customPassword);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name: 'Test User', role: 'user' })
    .returning();
  const token = signAccessToken(user.id);
  const { refreshToken } = await createSession(user.id);
  return { user, email, token, refreshToken, password: customPassword };
}

describe('POST /register', () => {
  it('registers a user without name', async () => {
    const email = uniqueEmail();
    const res = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('user');
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('id');
    expect(body.data.user).toHaveProperty('email', email);
    expect(body.data.user).toHaveProperty('name', null);
    expect(body.data.user).toHaveProperty('created_at');
    expect(body.data.user).not.toHaveProperty('passwordHash');
    expect(body.data.user).not.toHaveProperty('deletedAt');
    expect(body.data.user).not.toHaveProperty('password_hash');
    expect(body.data.user).not.toHaveProperty('deleted_at');
  });

  it('rejects a duplicate active email with CONFLICT', async () => {
    const email = uniqueEmail();

    const first = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password },
    });

    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password },
    });

    expect(second.statusCode).toBe(409);
    const body = second.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toBe('Email already registered');
    expect(body.error.details).toEqual([]);
  });

  it('rejects an invalid email with VALIDATION_ERROR', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'not-an-email', password },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeInstanceOf(Array);
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it('rejects a short password with VALIDATION_ERROR', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: uniqueEmail(), password: 'short' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /login', () => {
  it('logs in an active user', async () => {
    const email = uniqueEmail();
    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password, name: 'Login User' },
    });

    expect(register.statusCode).toBe(201);

    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('user');
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toHaveProperty('id');
    expect(body.data.user).toHaveProperty('email', email);
    expect(body.data.user).toHaveProperty('name', 'Login User');
    expect(body.data.user).toHaveProperty('created_at');
    expect(body.data.user).not.toHaveProperty('passwordHash');
    expect(body.data.user).not.toHaveProperty('deletedAt');
    expect(body.data.user).not.toHaveProperty('password_hash');
    expect(body.data.user).not.toHaveProperty('deleted_at');
  });

  it('rejects a wrong password with UNAUTHORIZED', async () => {
    const email = uniqueEmail();
    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password },
    });

    expect(register.statusCode).toBe(201);

    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email, password: 'wrong-password' },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a nonexistent email with UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: uniqueEmail(), password },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects login for a soft-deleted account with UNAUTHORIZED', async () => {
    const email = uniqueEmail();
    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email, password },
    });

    expect(register.statusCode).toBe(201);
    const regBody = register.json();
    const userId = regBody.data.user.id as string;
    const token = regBody.data.token as string;

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/users/${userId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(deleted.statusCode).toBe(200);

    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/v1/auth/change-password', () => {
  it('changes password successfully for authenticated user', async () => {
    const { email, token, refreshToken } = await createAuthTestUser();

    const newPassword = 'newPassword456!';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        currentPassword: password,
        newPassword,
        confirmPassword: newPassword,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('message');
    expect(body.data.message).toContain('Password changed successfully');

    // Verify old password cannot log in
    const oldLogin = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email, password },
    });
    expect(oldLogin.statusCode).toBe(401);

    // Verify new password logs in successfully
    const newLogin = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email, password: newPassword },
    });
    expect(newLogin.statusCode).toBe(200);

    // Verify previous refresh token was revoked
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/refresh',
      payload: { refreshToken },
    });
    expect(refreshRes.statusCode).toBe(401);
  });

  it('rejects change-password without Authorization header with 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      payload: {
        currentPassword: password,
        newPassword: 'newPassword456!',
        confirmPassword: 'newPassword456!',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects incorrect current password with 400 VALIDATION_ERROR', async () => {
    const { token } = await createAuthTestUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        currentPassword: 'wrong-current-password',
        newPassword: 'newPassword456!',
        confirmPassword: 'newPassword456!',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Incorrect current password');
  });

  it('rejects mismatched newPassword and confirmPassword with 400 VALIDATION_ERROR', async () => {
    const { token } = await createAuthTestUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        currentPassword: password,
        newPassword: 'newPassword456!',
        confirmPassword: 'differentPassword789!',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(body.error)).toContain('Passwords do not match');
  });

  it('rejects short newPassword (< 8 chars) with 400 VALIDATION_ERROR', async () => {
    const { token } = await createAuthTestUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        currentPassword: password,
        newPassword: 'short',
        confirmPassword: 'short',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

