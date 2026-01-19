import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as PrismaClientConstructor } from "./generated/prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClientConstructor };

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClientConstructor({
    adapter,
    log: ["query"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
