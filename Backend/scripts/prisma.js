import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const { DB_HOST, DB_PORT = '5432', DB_NAME, DB_USER, DB_PASSWORD } = process.env;
if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${encodeURIComponent(DB_NAME)}`;
} else if (!process.env.DATABASE_URL) {
    const missing = [
        ['DB_HOST', DB_HOST],
        ['DB_NAME', DB_NAME],
        ['DB_USER', DB_USER],
        ['DB_PASSWORD', DB_PASSWORD],
    ].filter(([, value]) => !value).map(([name]) => name);

    if (missing.length) {
        console.error(`Database configuration is incomplete. Add ${missing.join(', ')} to Backend/.env.`);
        process.exit(1);
    }
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const prismaCli = path.resolve(currentDirectory, '../node_modules/prisma/build/index.js');
const child = spawn(process.execPath, [prismaCli, ...process.argv.slice(2)], {
    cwd: path.resolve(currentDirectory, '..'),
    env: process.env,
    stdio: 'inherit',
});

child.on('error', (error) => {
    console.error(`Unable to start Prisma: ${error.message}`);
    process.exit(1);
});

child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
});
