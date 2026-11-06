// `npm run dev` — one command for development:
//  • builds the website, then rebuilds it whenever a frontend file changes
//  • restarts the server whenever a backend file changes
// Open http://localhost:3000 and refresh the page after a change.
const { execFileSync, spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const frontend = path.join(root, 'frontend');

execFileSync(process.execPath, [path.join(__dirname, 'ensure-frontend.js')], { stdio: 'inherit' });

const children = [
    spawn('npm', ['run', 'build', '--', '--watch', '--logLevel', 'warn'], { cwd: frontend, stdio: 'inherit' }),
    spawn(process.execPath, ['--watch', 'server.js'], { cwd: root, stdio: 'inherit' }),
];

const stop = () => {
    for (const child of children) child.kill('SIGTERM');
    process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
