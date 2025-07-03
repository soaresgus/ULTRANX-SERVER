import { FastifyInstance } from 'fastify';
import { loginUser } from '../auth/authService';
import { LoginSchema } from '../schema/userSchema';
import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { verificationTemplate } from '../emails/verification';
import { forgotPasswordTemplate } from '../emails/forgotPassword';
import bcrypt from 'bcrypt';
import { verify, sign } from 'jsonwebtoken';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
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
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Ignora validação de certificado autoassinado
    },
  });

  fastify.post(
    '/send-verification',
    {
      config: {
        rateLimit: {
          max: 5, // Número máximo de requisições permitidas
          timeWindow: '5 minute', // Janela de tempo para o limite (1 minuto)
        },
      },
    },
    async (request, reply) => {
      try {
        const emailSchema = z.object({
          email: z.string().email({ message: 'Email inválido' }),
        });

        const validation = emailSchema.safeParse(request.body);

        if (!validation.success) {
          return reply
            .status(400)
            .send({ success: false, message: validation.error.errors });
        }

        const { email } = validation.data;

        if (!email) {
          return reply
            .status(400)
            .send({ success: false, message: 'O campo email é obrigatório.' });
        }

        // Gera um código aleatório de 6 dígitos
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        // Define a expiração para 15 minutos a partir do envio
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Insere o registro no banco de dados
        await prisma.verification.create({
          data: {
            email,
            code: verificationCode,
            expiresAt,
          },
        });

        // Configura as opções do email
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Seu Código de Verificação',
          html: verificationTemplate.replace(
            '$verificationCode',
            verificationCode
          ),
        };

        // Envia o email
        await transporter.sendMail(mailOptions);

        return reply.send({
          success: true,
          message: 'Código enviado! Verifique seu email.',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply
          .status(500)
          .send({ success: false, message: 'Ocorreu um erro interno.' });
      }
    }
  );

  async function verifyCode(email: string, code: string): Promise<boolean> {
    const verificationRecord = await prisma.verification.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gte: new Date(), // Verifica se o código ainda é válido
        },
      },
    });

    const maxUses = 2;

    if (!verificationRecord || verificationRecord.uses >= maxUses) {
      return false
    }

    await prisma.verification.update({
      where: {
        id: verificationRecord.id,
      },
      data: {
        uses: verificationRecord.uses + 1
      }
    })

    if (verificationRecord.uses + 1 >= maxUses) {
      await prisma.verification.delete({
        where: { id: verificationRecord.id },
      });
    }

    return true;
  }

  fastify.post('/verify-code', async (request, reply) => {
    const verificationSchema = z.object({
      email: z.string().email({ message: 'Email inválido' }),
      code: z.string().length(6, { message: 'Código deve ter 6 dígitos' }),
    });

    const validation = verificationSchema.safeParse(request.body);
    if (!validation.success) {
      return reply
        .status(400)
        .send({ success: false, message: validation.error.errors });
    }

    const { email, code } = validation.data;

    const codeVerified = await verifyCode(email, code);

    if (!codeVerified) {
      return reply
        .status(400)
        .send({ success: false, message: 'Código inválido ou expirado.' });
    }

    return reply.send({
      success: true,
      message: 'Código verificado com sucesso!',
    });
  });

  fastify.post('/user-exists', async (request, reply) => {
    const emailSchema = z.object({
      email: z.string().email({ message: 'Email inválido' }),
    });

    const validation = emailSchema.safeParse(request.body);
    if (!validation.success) {
      return reply
        .status(400)
        .send({ success: false, message: validation.error.errors });
    }

    const { email } = validation.data;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return reply.send({ exists: true });
    } else {
      return reply.send({ exists: false });
    }
  });

  fastify.post(
    '/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5, // Número máximo de requisições permitidas
          timeWindow: '5 minute', // Janela de tempo para o limite (1 minuto)
        },
      },
    },
    async (request, reply) => {
      try {
        const emailSchema = z.object({
          email: z.string().email({ message: 'Email inválido' }),
        });

        const validation = emailSchema.safeParse(request.body);

        if (!validation.success) {
          return reply
            .status(400)
            .send({ success: false, message: validation.error.errors });
        }

        const { email } = validation.data;

        // Gera um código aleatório de 6 dígitos
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        // Define a expiração para 15 minutos a partir do envio
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Insere o registro no banco de dados
          await prisma.verification.create({
            data: {
              email,
              code: verificationCode,
              expiresAt,
            },
          });

          // Configura as opções do email
          const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Esqueci minha senha - ULTRA NX',
            html: forgotPasswordTemplate.replace(
              '$verificationCode',
              verificationCode
            ),
          };

          // Envia o email
          await transporter.sendMail(mailOptions);
        }

        return reply.send({
          success: true,
          message: 'Código enviado! Verifique seu email.',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply
          .status(500)
          .send({ success: false, message: 'Ocorreu um erro interno.' });
      }
    }
  );

  fastify.post('/reset-password', async (request, reply) => {
    try {
      const resetPasswordSchema = z.object({
        email: z.string().email({ message: 'Email inválido' }),
        code: z.string().length(6, { message: 'Código deve ter 6 dígitos' }),
        newPassword: z.string().min(6, { message: 'Senha muito curta' }),
      });

      const validation = resetPasswordSchema.safeParse(request.body);
      if (!validation.success) {
        return reply
          .status(400)
          .send({ success: false, message: validation.error.errors });
      }

      const { email, code, newPassword } = validation.data;

      const codeVerified = await verifyCode(email, code)

      if (!codeVerified) {
        return reply
          .status(400)
          .send({ success: false, message: 'Código inválido ou expirado.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { email },
        data: { passwordHash }, // Aqui você deve aplicar a hash na senha antes de salvar
      });

      return reply.send({
        success: true,
        message: 'Senha redefinida com sucesso!',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply
        .status(500)
        .send({ success: false, message: 'Ocorreu um erro interno.' });
    }
  });

  fastify.post('/refresh-token', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    if (!refreshToken) {
      return reply.status(400).send({ message: 'Refresh token não fornecido' });
    }

    try {
      const decoded = verify(refreshToken, process.env.REFRESH_SECRET!) as { userId: string };

      const session = await prisma.session.findFirst({
        where: { refreshToken },
      });

      if (!session) {
        return reply.status(401).send({ message: 'Sessão inválida ou expirada' });
      }

      const newAccessToken = sign({ userId: decoded.userId }, process.env.ACCESS_SECRET!, {
        expiresIn: '15m',
      });

      await prisma.session.update({
        where: { id: session.id },
        data: {
          accessToken: newAccessToken,
          tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      return reply.send({ accessToken: newAccessToken });
    } catch (error) {
      return reply.status(401).send({ message: 'Refresh token inválido ou expirado' });
    }
  });
}
