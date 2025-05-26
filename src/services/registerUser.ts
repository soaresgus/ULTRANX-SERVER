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
    message: 'User registered successfully',
    email,
    firstName,
    surname,
  };
}
