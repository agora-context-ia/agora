import { PrismaClient } from '@prisma/client';

// Singleton: a single connection (pool) per process. Imported by the
// Prisma repositories of every module.
export const prisma = new PrismaClient();
