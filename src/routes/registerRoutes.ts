import { FastifyInstance } from 'fastify';
import { RegisterUserSchema } from '../schema/authSchema';
import { registerUser } from '../services/registerUser';

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const { email, firstName, surname, password } = RegisterUserSchema.parse(
      request.body
    );

    const registeredUser = await registerUser(
      email,
      firstName,
      surname,
      password
    );

    return reply.send(registeredUser);
  });
}
