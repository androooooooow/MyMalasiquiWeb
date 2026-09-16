import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    const { DB_HOST, DB_PORT = '5432', DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
        process.env.DATABASE_URL = `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    }
}

const { PrismaClient } = await import('@prisma/client');
const prisma = globalThis.__malasiquiPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.__malasiquiPrisma = prisma;

export default prisma;
