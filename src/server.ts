import Fastify, { FastifyInstance } from 'fastify';
import { authMiddleware } from './middleware/authMiddleware';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import cors from '@fastify/cors';
import { registerRoute } from './routes/registerRoute';
import fastifyRateLimit from '@fastify/rate-limit';

const fastify = Fastify({ logger: true });

const port = 5577;

// Habilitando CORS
fastify.register(cors, {
  origin: '*', // ⚠️ Permite todas as origens (ideal para testes, mas não para produção)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(fastifyRateLimit, {
  global: false, // Desativa o rate limit global para que cada rota tenha sua própria configuração
});

export async function apiRoutesMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.register(userRoutes);
}

export async function apiAuthRoutes(fastify: FastifyInstance) {
  fastify.register(authRoutes);
  fastify.register(registerRoute);
}

fastify.register(apiRoutesMiddleware, { prefix: '/api' });
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
