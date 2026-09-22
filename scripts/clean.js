const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
    'node_modules',
    'UnlimDesk-win32-x64',
    'UnlimDesk-linux-x64',
    'UnlimDesk-darwin-x64'
];

for (const target of targets) {
    fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

console.log('Dependencies and build outputs removed.');
