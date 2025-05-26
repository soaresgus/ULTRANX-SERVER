import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginUser } from '../auth/authService';
import { LoginSchema } from '../schema/authSchema';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, password } = LoginSchema.parse(request.body);

      const userAgent = request.headers['user-agent'] || '';
      const ipAddress = request.ip || '';

      const { accessToken, refreshToken, sessionId } = await loginUser(
        email,
        password,
        userAgent,
        ipAddress
      );

      return reply.send({
        accessToken,
        refreshToken,
        sessionId,
      });
    }
  );
}
