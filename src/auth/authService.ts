import { sign } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

export async function loginUser(
  email: string,
  password: string,
  userAgent: string,
  ipAddress: string
) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new Error('Credenciais inválidas');

  // TODO: Create a secrete for both tokens on .env file

  const accessToken = sign({ userId: user.id }, process.env.ACCESS_SECRET!, {
    expiresIn: '15m',
  });
  const refreshToken = sign({ userId: user.id }, process.env.REFRESH_SECRET!, {
    expiresIn: '7d',
  });

  const existingSession = await prisma.session.findFirst({
    where: { userId: user.id, userAgent, ipAddress },
  });

  if (existingSession) {
    await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken, sessionId: existingSession.id };
  }

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      userAgent,
      ipAddress,
    },
  });

  return { accessToken, refreshToken, sessionId: session.id };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function logout(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}
