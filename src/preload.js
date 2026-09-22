const { contextBridge, ipcRenderer } = require('electron');

let initialized = false;
let observer = null;
let filesUnlocked = false;

function removeUnwantedLinks() {
    for (const title of ['Gallery', 'Library']) {
        document.querySelector(`a[title="${title}"]`)?.remove();
    }
}

function renameOpenButtons() {
    for (const span of document.querySelectorAll('span.text')) {
        if (span.textContent.trim() === 'Open') {
            span.textContent = 'Download';
        }
    }
}

function updateUploadIndicator() {
    const isUploading = Boolean(document.querySelector('a[title="Uploading"]'));
    const existingBar = document.getElementById('unlimdesk-upload-progress');

    if (!isUploading) {
        existingBar?.remove();
        return;
    }

    if (existingBar) {
        return;
    }

    const styleId = 'unlimdesk-upload-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes unlimdesk-upload {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head?.appendChild(style);
    }

    const bar = document.createElement('div');
    bar.id = 'unlimdesk-upload-progress';
    Object.assign(bar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '3px',
        backgroundColor: '#0088cc',
        zIndex: '999999',
        transform: 'translateX(-100%)',
        animation: 'unlimdesk-upload 2s linear infinite',
        pointerEvents: 'none'
    });
    document.body?.appendChild(bar);
}

function addLogoutButton(profileImage) {
    if (document.getElementById('unlimdesk-logout')) {
        return;
    }

    const parent = profileImage.parentElement;
    if (!parent) {
        return;
    }

    const button = document.createElement('button');
    button.id = 'unlimdesk-logout';
    button.type = 'button';
    button.textContent = '👋';
    button.title = 'Logout';

    Object.assign(button.style, {
        marginLeft: '10px',
        padding: '4px 8px',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    });

    button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.8';
    });
    button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
    });
    button.addEventListener('click', () => {
        ipcRenderer.invoke('logout-user');
    });

    parent.appendChild(button);
}

function unlockFilesWhenReady() {
    if (filesUnlocked) {
        return;
    }

    const filesLink = document.querySelector('a[title="Files"]');
    if (filesLink) {
        filesLink.style.pointerEvents = 'none';
        filesLink.style.opacity = '0.5';
    }

    const profileImage = document.querySelector('img[src^="blob:"][class*="rounded-full"]');
    if (!profileImage || !filesLink) {
        return;
    }

    filesUnlocked = true;
    filesLink.style.pointerEvents = 'auto';
    filesLink.style.opacity = '1';
    addLogoutButton(profileImage);

    // Conserve le comportement historique : ouverture automatique de Files après login.
    filesLink.click();
}

function refreshPageEnhancements() {
    removeUnwantedLinks();
    renameOpenButtons();
    updateUploadIndicator();
    unlockFilesWhenReady();
}

function initialize() {
    if (initialized) {
        refreshPageEnhancements();
        return;
    }

    initialized = true;
    refreshPageEnhancements();

    observer = new MutationObserver(() => {
        refreshPageEnhancements();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    window.addEventListener('beforeunload', () => {
        observer?.disconnect();
        observer = null;
        initialized = false;
        filesUnlocked = false;
    }, { once: true });
}

contextBridge.exposeInMainWorld('electronAPI', {
    initialize
});
