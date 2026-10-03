import { PrismaClient } from '@prisma/client';

// Patrón Singleton para el cliente de Prisma
// Evita crear múltiples conexiones a PostgreSQL durante el desarrollo
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

export default prisma;
