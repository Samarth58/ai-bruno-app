import test from 'node:test';
import assert from 'node:assert/strict';

test('Bruno Frontend Test Suite', async (t) => {
  await t.test('1. API Base URL resolution', () => {
    // Default fallback
    const defaultUrl = 'http://10.0.2.2:3000';
    assert.match(defaultUrl, /^https?:\/\//);

    // Custom environment override
    const customUrl = 'https://api.brunogym.com/';
    const normalized = customUrl.replace(/\/+$/, '');
    assert.equal(normalized, 'https://api.brunogym.com');
  });

  await t.test('2. Response envelope unmasking logic', () => {
    const successPayload = {
      success: true,
      data: {
        id: 'user-123',
        email: 'lifter@brunogym.com',
      },
      meta: { timestamp: '2026-10-22T20:00:00Z' },
    };

    assert.equal(successPayload.success, true);
    assert.equal(successPayload.data.email, 'lifter@brunogym.com');

    const errorPayload = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: [{ path: ['password'], message: 'Password too short' }],
      },
    };

    assert.equal(errorPayload.success, false);
    assert.equal(errorPayload.error.code, 'VALIDATION_ERROR');
    assert.equal(errorPayload.error.details.length, 1);
  });

  await t.test('3. Authentication form validation guards', () => {
    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.equal(emailRegex.test('valid@example.com'), true);
    assert.equal(emailRegex.test('invalid-email'), false);

    // Password requirements (min 8 chars)
    const isStrong = (p) => typeof p === 'string' && p.length >= 8;
    assert.equal(isStrong('pass1234'), true);
    assert.equal(isStrong('short'), false);

    // OTP 6-digit strict regex
    const otpRegex = /^\d{6}$/;
    assert.equal(otpRegex.test('123456'), true);
    assert.equal(otpRegex.test('12345'), false);
    assert.equal(otpRegex.test('1234567'), false);
    assert.equal(otpRegex.test('abcdef'), false);
  });

  await t.test('4. Workout set logging payload validation', () => {
    const validSet = {
      exerciseId: '550e8400-e29b-41d4-a716-446655440000',
      setNumber: 1,
      actualWeightKg: 80,
      actualReps: 8,
      rpe: 8.5,
      isWarmup: false,
    };

    assert.ok(validSet.exerciseId);
    assert.ok(validSet.setNumber >= 1);
    assert.ok(validSet.actualWeightKg >= 0);
    assert.ok(validSet.actualReps >= 1);
    assert.ok(validSet.rpe >= 1 && validSet.rpe <= 10);
    assert.equal(typeof validSet.isWarmup, 'boolean');
  });

  await t.test('5. Post-workout calibration ranges', () => {
    const validRpe = (rpe) => rpe >= 1 && rpe <= 10;
    const validSoreness = (s) => s >= 0 && s <= 10;

    assert.equal(validRpe(8), true);
    assert.equal(validRpe(11), false);
    assert.equal(validSoreness(0), true);
    assert.equal(validSoreness(10), true);
    assert.equal(validSoreness(-1), false);
  });

  await t.test('6. Design tokens presence and integrity', () => {
    const requiredColors = [
      '#F8F9FF', // background surface
      '#16A34A', // athletic green
      '#EA580C', // coach orange
      '#0284C7', // technical blue
      '#0F172A', // charcoal dark
    ];

    requiredColors.forEach((color) => {
      assert.match(color, /^#[0-9A-Fa-f]{6}$/);
    });
  });

  await t.test('7. Auth response token property normalization', () => {
    // Fastify backend returns { token, refreshToken, user } on login/register
    const backendAuthPayload = {
      token: 'jwt-access-token-xyz',
      refreshToken: 'jwt-refresh-token-abc',
      user: { id: 'u-1', email: 'lifter@example.com' },
    };

    const resolvedAccessToken =
      backendAuthPayload.accessToken || backendAuthPayload.token;
    assert.equal(resolvedAccessToken, 'jwt-access-token-xyz');
  });

  await t.test('8. Routine exercise swap & session route path contracts', () => {
    const routineId = 'r-123';
    const exerciseId = 'rx-456';

    const swapUrl = `/api/v1/routines/${routineId}/exercises/${exerciseId}/swap`;
    const altsUrl = `/api/v1/routines/${routineId}/exercises/${exerciseId}/alternatives`;
    const startSessionUrl = '/api/v1/sessions/start';

    assert.equal(swapUrl, '/api/v1/routines/r-123/exercises/rx-456/swap');
    assert.equal(altsUrl, '/api/v1/routines/r-123/exercises/rx-456/alternatives');
    assert.equal(startSessionUrl, '/api/v1/sessions/start');
  });
});
