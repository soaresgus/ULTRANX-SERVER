import Fastify, { FastifyInstance } from 'fastify';
import { authMiddleware } from './middleware/authMiddleware';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';

const fastify = Fastify({ logger: true });

const port = 5577;

export async function apiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
}

export async function apiAuthRoutes(fastify: FastifyInstance) {
  fastify.register(authRoutes);
  fastify.register(userRoutes);
}

fastify.register(apiRoutes, { prefix: '/api' });
fastify.register(apiAuthRoutes, { prefix: '/api/auth' });

const start = async () => {
  try {
    await fastify.listen({ port });
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
