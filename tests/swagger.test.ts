import '@fastify/swagger';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('OpenAPI / Swagger Documentation', () => {
  it('initializes Swagger and generates a valid OpenAPI 3.x document for Bruno AI Gym Buddy', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    expect(openapi).toBeDefined();
    expect(openapi.openapi).toMatch(/^3\./);
    expect(openapi.info.title).toBe('Bruno — AI Gym Buddy API');
    expect(openapi.info.version).toBe('1.0.0');
    expect(openapi.info.description).toContain('Bruno');
  });

  it('exposes Swagger UI at /docs', async () => {
    const app = buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/docs/',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('exposes OpenAPI JSON specification via Swagger endpoint', async () => {
    const app = buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(res.statusCode).toBe(200);
    const spec = res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths).toBeDefined();
  });

  it('configures relative server URL without hardcoding localhost or domains', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    expect(openapi.servers).toBeDefined();
    expect(openapi.servers?.length).toBeGreaterThanOrEqual(1);
    expect(openapi.servers?.[0]?.url).toBe('/');
  });

  it('configures the Bearer JWT security scheme', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    expect(openapi.components?.securitySchemes).toBeDefined();
    expect(openapi.components?.securitySchemes?.bearerAuth).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT access token (Bearer <token>)',
    });
  });

  it('documents health endpoint', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    expect(openapi.paths?.['/health']).toBeDefined();
    expect(openapi.paths?.['/health']?.get).toBeDefined();
    expect(openapi.paths?.['/health']?.get?.tags).toContain('Health');
  });

  it('documents canonical versioned /api/v1 authentication endpoints and hides unversioned aliases', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    const paths = openapi.paths || {};

    // Canonical versioned paths
    expect(paths['/api/v1/register']?.post).toBeDefined();
    expect(paths['/api/v1/register']?.post?.tags).toContain('Auth');

    expect(paths['/api/v1/login']?.post).toBeDefined();
    expect(paths['/api/v1/login']?.post?.tags).toContain('Auth');

    expect(paths['/api/v1/refresh']?.post).toBeDefined();
    expect(paths['/api/v1/refresh']?.post?.tags).toContain('Auth');

    expect(paths['/api/v1/logout']?.post).toBeDefined();
    expect(paths['/api/v1/logout']?.post?.tags).toContain('Auth');

    // Unversioned aliases must not be exposed in documentation
    expect(paths['/register']).toBeUndefined();
    expect(paths['/login']).toBeUndefined();
    expect(paths['/refresh']).toBeUndefined();
    expect(paths['/logout']).toBeUndefined();
  });

  it('documents canonical user and admin endpoints under /api/v1 with bearer security', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    const paths = openapi.paths || {};

    // User endpoints
    expect(paths['/api/v1/users/{id}']?.get).toBeDefined();
    expect(paths['/api/v1/users/{id}']?.put).toBeDefined();
    expect(paths['/api/v1/users/{id}']?.delete).toBeDefined();

    // Admin endpoints
    expect(paths['/api/v1/admin/users']?.get).toBeDefined();
    expect(paths['/api/v1/admin/users/{id}']?.get).toBeDefined();
    expect(paths['/api/v1/admin/users/{id}/role']?.patch).toBeDefined();
    expect(paths['/api/v1/admin/users/{id}/revoke-sessions']?.post).toBeDefined();
    expect(paths['/api/v1/admin/users/{id}']?.delete).toBeDefined();

    // Verify bearer auth on protected routes
    expect(paths['/api/v1/admin/users']?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths['/api/v1/admin/users/{id}/role']?.patch?.security).toEqual([
      { bearerAuth: [] },
    ]);

    // Unversioned aliases must not be exposed in documentation
    expect(paths['/users/{id}']).toBeUndefined();
    expect(paths['/admin/users']).toBeUndefined();
  });

  it('documents Bruno gym profiles, physical constraints, exercises, and categories under /api/v1', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    const paths = openapi.paths || {};

    // Gym profiles
    expect(paths['/api/v1/gym-profiles']?.post).toBeDefined();
    expect(paths['/api/v1/gym-profiles']?.get).toBeDefined();
    expect(paths['/api/v1/gym-profiles/{id}']?.get).toBeDefined();
    expect(paths['/api/v1/gym-profiles/{id}']?.put).toBeDefined();
    expect(paths['/api/v1/gym-profiles/{id}']?.delete).toBeDefined();
    expect(paths['/api/v1/gym-profiles']?.get?.tags).toContain('Gym Profiles');

    // Physical constraints
    expect(paths['/api/v1/constraints']?.post).toBeDefined();
    expect(paths['/api/v1/constraints']?.get).toBeDefined();
    expect(paths['/api/v1/constraints/{id}']?.get).toBeDefined();
    expect(paths['/api/v1/constraints/{id}']?.put).toBeDefined();
    expect(paths['/api/v1/constraints/{id}']?.delete).toBeDefined();
    expect(paths['/api/v1/constraints']?.get?.tags).toContain('Physical Constraints');

    // Exercise catalogue
    expect(paths['/api/v1/exercises']?.get).toBeDefined();
    expect(paths['/api/v1/exercises/{id}']?.get).toBeDefined();
    expect(paths['/api/v1/exercises']?.get?.tags).toContain('Exercises');

    // Categories
    expect(paths['/api/v1/categories']?.get).toBeDefined();
    expect(paths['/api/v1/categories']?.post).toBeDefined();

    // Unversioned aliases must not be exposed in documentation
    expect(paths['/gym-profiles']).toBeUndefined();
    expect(paths['/constraints']).toBeUndefined();
    expect(paths['/exercises']).toBeUndefined();
    expect(paths['/categories']).toBeUndefined();
  });

  it('does NOT expose starter-kit example demo endpoints in Swagger', async () => {
    const app = buildApp();
    await app.ready();

    const openapi = app.swagger() as OpenAPIV3.Document;
    const paths = openapi.paths || {};

    expect(paths['/examples']).toBeUndefined();
    expect(paths['/api/v1/examples']).toBeUndefined();
    expect(paths['/examples/{id}']).toBeUndefined();
    expect(paths['/api/v1/examples/{id}']).toBeUndefined();
  });

  it('preserves normal route execution and behavior', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });
});
