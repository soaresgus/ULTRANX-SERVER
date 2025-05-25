import Fastify, { FastifyInstance } from 'fastify';
import { authMiddleware } from './middleware/authMiddleware';
import { authRoutes } from './routes/authRoutes';

const fastify = Fastify({ logger: true });

const port = 5577;

export async function apiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  await authRoutes(fastify);
}

fastify.register(apiRoutes, { prefix: '/api' });

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
