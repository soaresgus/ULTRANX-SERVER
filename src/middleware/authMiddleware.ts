import { FastifyReply, FastifyRequest } from 'fastify';
import { verify } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserSchema } from '../schema/userSchema';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  try {
    const decoded = verify(token, process.env.ACCESS_SECRET!) as {
      userId: string;
    };

    // Verifica se a sessão é válida no banco de dados
    const session = await prisma.session.findFirst({
      where: { accessToken: token },
    });
    if (!session) {
      return reply.status(401).send({ message: 'Sessão inválida ou expirada' });
    }

    // Valida `user` usando Zod antes de adicionar ao request
    const user = UserSchema.pick({ id: true }).parse({ id: decoded.userId });

    // Usa `Object.assign` para garantir que TypeScript reconheça `req.user`
    Object.assign(req, { user });
  } catch (error) {
    return reply.status(401).send({ message: 'Token inválido ou expirado' });
  }
}
