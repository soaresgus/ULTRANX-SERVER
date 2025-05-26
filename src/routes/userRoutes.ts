import { FastifyInstance } from 'fastify';
import { RegisterUserSchema, UpdateUserSchema } from '../schema/userSchema';
import { registerUser } from '../services/registerUser';
import { prisma } from '../lib/prisma';

export async function userRoutes(fastify: FastifyInstance) {
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

  fastify.put('/update/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { active, email, firstName, surname, userKey } =
      UpdateUserSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        active: active !== undefined ? active : user.active,
        email,
        firstName,
        surname,
        userKey,
        nameWithSurname: `${firstName} ${surname}`,
        updatedAt: new Date(),
      },
    });

    if (!updatedUser) {
      return reply.status(500).send({ message: 'Failed to update user' });
    }

    return reply.send({ message: 'User updated successfully', id });
  });
}
