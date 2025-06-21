import { hashPassword } from '../auth/authService';
import { prisma } from '../lib/prisma';

export async function registerUser(
  email: string,
  firstName: string,
  surname: string,
  password: string
) {
  console.log(
    `Registering user, Email: ${email}, First Name: ${firstName}, Surname: ${surname}`
  );

  const passwordHash = await hashPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error(`User with email ${email} already exists.`);
    throw new Error('Já existe um usuário com este email.');
  }

  await prisma.user.create({
    data: {
      email,
      firstName,
      surname,
      passwordHash,
      nameWithSurname: `${firstName} ${surname}`,
    },
  });

  console.log(`User registered successfully: ${email}`);

  return {
    message: 'Usuário registrado com sucesso',
    email,
    firstName,
    surname,
  };
}
