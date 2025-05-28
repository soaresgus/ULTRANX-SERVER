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

  fastify.get('/users', async (request, reply) => {
    const { page = 1, limit = 10 } = request.query as {
      page?: string | number;
      limit?: string | number;
    };
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return reply.send({
      users,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  });

  fastify.get('/user/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    return reply.send(user);
  });
}
