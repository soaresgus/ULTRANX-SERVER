import { faker } from '@faker-js/faker';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../auth/authService';

async function main() {
  const users = [];

  for (let i = 0; i < 30; i++) {
    const firstName = faker.person.firstName();
    const surname = faker.person.lastName();
    const nameWithSurname = `${firstName} ${surname}`;

    users.push({
      email: faker.internet.email(),
      firstName,
      surname,
      passwordHash: await hashPassword('1234@1'),
      nameWithSurname,
      active: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  console.log('Usuários aleatórios inseridos com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
