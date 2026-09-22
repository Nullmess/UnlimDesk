const { BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const CONFIG = require('./config');

function isAllowedUrl(url) {
    try {
        const parsed = new URL(url);
        return CONFIG.ALLOWED_ORIGINS.includes(parsed.origin);
    } catch {
        return false;
    }
}

function openExternal(url) {
    if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url).catch((error) => {
            console.error('Impossible d’ouvrir le lien externe :', error);
        });
    }
}

function configureNavigation(win) {
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isAllowedUrl(url)) {
            return { action: 'allow' };
        }

        openExternal(url);
        return { action: 'deny' };
    });

    win.webContents.on('will-navigate', (event, url) => {
        if (!isAllowedUrl(url)) {
            event.preventDefault();
            openExternal(url);
        }
    });
}

function configureKeyboard(win) {
    win.webContents.on('before-input-event', (event, input) => {
        const isReload = input.type === 'keyDown' && input.key === 'F5';
        const isDevTools =
            input.type === 'keyDown' &&
            ((input.control || input.meta) && input.shift && input.code === 'KeyI');
        const isF12 = input.type === 'keyDown' && input.code === 'F12';

        if (isReload) {
            event.preventDefault();
            win.webContents.reload();
            return;
        }

        if (isDevTools || isF12) {
            event.preventDefault();
        }
    });

    win.webContents.on('context-menu', (event) => {
        event.preventDefault();
    });
}

function configureLoadErrors(win) {
    win.webContents.on(
        'did-fail-load',
        (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            if (!isMainFrame || errorCode === -3) {
                return;
            }

            dialog.showErrorBox(
                'Erreur de connexion',
                `Impossible de charger Unlim Cloud.\n\n${errorDescription}\n${validatedURL}`
            );
        }
    );
}

function createMainWindow() {
    const iconFile = process.platform === 'win32' ? 'app-icon.ico' : 'app-icon.png';

    const win = new BrowserWindow({
        title: 'UnlimDesk',
        width: 1270,
        height: 890,
        minWidth: 900,
        minHeight: 650,
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, '..', 'assets', iconFile),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            webviewTag: false,
            backgroundThrottling: false
        }
    });

    // Garde le User-Agent Chromium natif en retirant uniquement le token Electron.
    const userAgent = win.webContents
        .getUserAgent()
        .replace(/\sElectron\/[^\s]+/g, '');
    win.webContents.setUserAgent(userAgent);

    configureNavigation(win);
    configureKeyboard(win);
    configureLoadErrors(win);

    win.on('page-title-updated', (event) => {
        event.preventDefault();
        win.setTitle('UnlimDesk');
    });

    win.once('ready-to-show', () => {
        win.show();
    });

    win.webContents.on('did-finish-load', () => {
        win.webContents
            .executeJavaScript('window.electronAPI?.initialize?.()')
            .catch((error) => {
                console.error('Impossible d’initialiser les améliorations UI :', error);
            });
    });

    win.loadURL(CONFIG.APP_URL);
    return win;
}

module.exports = { createMainWindow };
