import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

const port = 5577;

const start = async () => {
  try {
    await fastify.listen({ port });
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
