import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ message: 'Auth route is working!' });
  });
}
