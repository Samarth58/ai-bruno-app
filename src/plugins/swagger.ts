import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function swaggerPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Bruno — AI Gym Buddy API',
        description:
          'Bruno AI Gym Buddy backend API — intelligent fitness and workout companion featuring JWT authentication, gym profile customization, physical constraint adaptation, and exercise catalogue management.',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Current Environment API Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT access token (Bearer <token>)',
          },
        },
      },
    },
    transform: ({ schema, url }) => {
      // Exclude unversioned root-level route aliases so /api/v1 is the canonical frontend API interface
      if (!url.startsWith('/api/v1') && !url.startsWith('/health')) {
        return { schema: { ...schema, hide: true }, url };
      }
      return { schema, url };
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: false,
  });
}

export const registerSwagger = fp(swaggerPlugin, {
  name: 'app-swagger',
});
