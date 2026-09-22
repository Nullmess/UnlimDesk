const { app, ipcMain, session } = require('electron');
const { createMainWindow } = require('./window');
const CONFIG = require('./config');

let mainWindow = null;

function registerIpcHandlers() {
    ipcMain.handle('logout-user', async () => {
        try {
            await session.defaultSession.clearStorageData();

            if (mainWindow && !mainWindow.isDestroyed()) {
                await mainWindow.loadURL(CONFIG.APP_URL);
            }
        } catch (error) {
            console.error('Erreur pendant la déconnexion :', error);
        }
    });
}

function createWindow() {
    mainWindow = createMainWindow();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
