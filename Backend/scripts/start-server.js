import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watchMode = process.argv.includes('--watch');
const serverEnvironment = { ...process.env, NODE_USE_SYSTEM_CA: '1' };

// Avast can inject a per-process SSL key-log named pipe into terminal sessions.
// A stale or inaccessible pipe makes Node fail outbound TLS sockets with EACCES.
// It is not required by the application, so do not pass it to the server child.
delete serverEnvironment.SSLKEYLOGFILE;

const nodeArguments = [
    '--use-system-ca',
    ...(watchMode ? ['--watch'] : []),
    'server.js',
];

const server = spawn(process.execPath, nodeArguments, {
    cwd: backendDirectory,
    env: serverEnvironment,
    stdio: 'inherit',
    windowsHide: true,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        if (!server.killed) server.kill(signal);
    });
}

server.on('error', (error) => {
    console.error(`Unable to start the backend: ${error.message}`);
    process.exitCode = 1;
});

server.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 0 : 1));
});
