import { verify, sign } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

async function loginUser(
  email: string,
  password: string,
  userAgent: string,
  ipAddress: string
) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password)
    throw new Error('Credenciais inválidas');

  const accessToken = sign({ userId: user.id }, 'ACCESS_SECRET', {
    expiresIn: '15m',
  });
  const refreshToken = sign({ userId: user.id }, 'REFRESH_SECRET', {
    expiresIn: '7d',
  });

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

async function refreshAccessToken(refreshToken: string) {
  const decoded = verify(refreshToken, 'REFRESH_SECRET');
  const session = await prisma.session.findFirst({ where: { refreshToken } });

  if (
    !session ||
    typeof decoded !== 'object' ||
    decoded === null ||
    !('userId' in decoded) ||
    session.userId !== (decoded as any).userId
  )
    throw new Error('Token inválido');

  const newAccessToken = sign({ userId: session.userId }, 'ACCESS_SECRET', {
    expiresIn: '15m',
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });

  return { accessToken: newAccessToken };
}

async function logout(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}
