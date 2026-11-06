// Runs before `npm start`: makes sure the website (frontend/dist) exists and is up to date.
// If any frontend file is newer than the last build, it rebuilds (installing packages the first time).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontend = path.join(__dirname, '..', 'frontend');
const builtPage = path.join(frontend, 'dist', 'index.html');

function newestChange(target) {
    if (!fs.existsSync(target)) return 0;
    const stat = fs.statSync(target);
    if (!stat.isDirectory()) return stat.mtimeMs;
    return fs.readdirSync(target).reduce((latest, name) => Math.max(latest, newestChange(path.join(target, name))), 0);
}

const sources = ['src', 'public', 'index.html', 'vite.config.js', 'package.json'].map((p) => path.join(frontend, p));
const sourceTime = Math.max(...sources.map(newestChange));
const builtTime = fs.existsSync(builtPage) ? fs.statSync(builtPage).mtimeMs : 0;

if (builtTime >= sourceTime) {
    console.log('✓ Website is built and up to date');
    process.exit(0);
}

try {
    if (!fs.existsSync(path.join(frontend, 'node_modules'))) {
        console.log('Installing website packages (first time only)…');
        execSync('npm install --include=dev --no-audit --no-fund', { cwd: frontend, stdio: 'inherit' });
    }
    console.log('Building the website…');
    execSync('npm run build', { cwd: frontend, stdio: 'inherit' });
} catch {
    console.error('\n✖ The website could not be built. Check the messages above.\n');
    process.exit(1);
}
