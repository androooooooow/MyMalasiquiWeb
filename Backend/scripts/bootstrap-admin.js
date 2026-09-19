import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

async function secretPrompt() {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
        throw new Error('Run this command in an interactive terminal to enter the password securely.');
    }
    return new Promise((resolve, reject) => {
        let value = '';
        process.stdout.write('Admin password: ');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        const finish = (error) => {
            process.stdin.removeListener('data', onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write('\n');
            if (error) reject(error);
            else resolve(value);
        };
        const onData = (chunk) => {
            for (const char of chunk) {
                if (char === '\r' || char === '\n') return finish();
                if (char === '\u0003') return finish(new Error('Cancelled.'));
                if (char === '\u007f' || char === '\b') {
                    if (value.length) {
                        value = value.slice(0, -1);
                        process.stdout.write('\b \b');
                    }
                } else if (char >= ' ' && char !== '\u007f') {
                    value += char;
                    process.stdout.write('*');
                }
            }
        };
        process.stdin.on('data', onData);
    });
}

async function main() {
    const existingAdmins = await prisma.user.count({ where: { role: 'admin' } });
    if (existingAdmins) throw new Error('An administrator account already exists. Bootstrap is disabled.');

    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    const name = (await prompt.question('Admin full name: ')).trim();
    const email = (await prompt.question('Admin email: ')).trim().toLowerCase();
    prompt.close();
    const password = await secretPrompt();

    if (name.length < 2 || name.length > 100) throw new Error('Name must be 2–100 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 50) throw new Error('Enter a valid email address (up to 50 characters).');
    if (password.length < 8 || password.length > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw new Error('Password must be 8–72 characters with uppercase, lowercase, and a number.');
    }
    const duplicate = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (duplicate) throw new Error('This email already belongs to an account. Use a different admin email.');

    await prisma.user.create({
        data: {
            name,
            email,
            address: 'Malasiqui, Pangasinan',
            phoneNum: '',
            role: 'admin',
            password: await bcrypt.hash(password, 12),
            emailVerifiedAt: new Date(),
            authProvider: 'local',
        },
    });
    console.log('Administrator account created. Sign in with the admin email and password.');
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
