import isElectron from 'is-electron';

// Restarting reloads the server, which is what registers plugin mount routes.
// Electron relaunches the whole app; the Android app restarts its bundled
// server through the WebView bridge (MainActivity.WebBridge) and reloads the
// page once it's back. A plain browser has neither.
type RestartWindow = Window & {
    ipcRenderer?: { send: (channel: string) => void };
    GSenderAndroid?: { restartServer?: () => void };
};

const host = () => window as unknown as RestartWindow;

export const canRestartApp = (): boolean =>
    isElectron() || typeof host().GSenderAndroid?.restartServer === 'function';

export const restartApp = (): void => {
    if (isElectron()) {
        host().ipcRenderer?.send('app-restart');
        return;
    }
    host().GSenderAndroid?.restartServer?.();
};
