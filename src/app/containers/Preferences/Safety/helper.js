import isElectron from 'is-electron';

const getAllErrors = async () => {
    if (!isElectron()) {
        return [];
    }

    const log = await window.ipcRenderer.invoke('grblLog:fetch');
    console.log(log);

    return log;
};

export { getAllErrors };
