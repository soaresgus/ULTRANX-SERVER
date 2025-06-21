import { FastifyInstance } from 'fastify';
import { RegisterUserSchema } from '../schema/userSchema';
import { registerUser } from '../services/registerUser';

export async function registerRoute(fastify: FastifyInstance) {
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

    if (!registeredUser) {
      return reply.status(500).send({ message: 'Failed to register user' });
    }

    return reply.send(registeredUser);
  });
}
