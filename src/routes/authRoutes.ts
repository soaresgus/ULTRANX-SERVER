import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginUser } from '../auth/authService';
import { LoginSchema } from '../schema/userSchema';
import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { verificationTemplate } from '../emails/verification';

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

  fastify.post('/send-verification', async (request, reply) => {
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
  });

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
    const verificationRecord = await prisma.verification.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gte: new Date(), // Verifica se o código ainda é válido
        },
      },
    });

    if (!verificationRecord) {
      return reply
        .status(400)
        .send({ success: false, message: 'Código inválido ou expirado.' });
    }

    return reply.send({
      success: true,
      message: 'Código verificado com sucesso!',
    });
  });
}
