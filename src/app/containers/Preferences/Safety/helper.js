import isElectron from 'is-electron';

const getAllErrors = () => {
    let content = '';
    // Check whether the code is running in Electron renderer process
    if (isElectron()) {
        window.ipcRenderer.invoke('grblLog:fetch').then(data => {
            return data;
        });
    }
    return content;
};

export { getAllErrors };
