const fs = require('fs');
const os = require('os');
const path = require('path');

function status(ok, message) {
    console.log(`${ok ? '✓' : '✗'} ${message}`);
    return ok;
}

let ok = true;

console.log(`UnlimDesk doctor`);
console.log(`Node: ${process.version}`);
console.log(`OS: ${os.platform()} ${os.release()} ${os.arch()}`);

ok &= status(fs.existsSync(path.join(__dirname, '..', 'src', 'main.js')), 'src/main.js présent');
ok &= status(fs.existsSync(path.join(__dirname, '..', 'assets', 'app-icon.png')), 'assets/app-icon.png présent');
ok &= status(fs.existsSync(path.join(__dirname, '..', 'node_modules', 'electron')), 'Electron installé');

if (process.platform === 'linux') {
    const restrictionFile = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';

    if (fs.existsSync(restrictionFile)) {
        const restricted = fs.readFileSync(restrictionFile, 'utf8').trim() === '1';
        console.log(`AppArmor userns restriction: ${restricted ? 'active' : 'inactive'}`);

        if (restricted) {
            console.log('Si Electron plante avec zygote_host_impl_linux.cc, exécute : npm run setup-linux');
        }
    }
}

process.exit(ok ? 0 : 1);
