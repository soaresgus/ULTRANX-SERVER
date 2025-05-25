import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDB() {
  try {
    await prisma.$connect();
    console.log('Conectado ao banco de dados!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
}

checkDB();
export { prisma };
