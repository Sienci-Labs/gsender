import api from 'app/api';
import isElectron from 'is-electron';

const actions = {
    fetchSettings: async (setHeadlessSettings, setOldSettings) => {
        try {
            let res = await api.remoteSetting.fetch();
            const remote = res.body;
            setHeadlessSettings(remote);
            setOldSettings(remote);
        } catch (error) {
            console.log(error);
        }
    },
    saveSettings: async (headlessSettings) => {
        await api.remoteSetting.update(headlessSettings).then(() => {
            //App restart logic goes here
            if (isElectron()) {
            //call the event that handles app restart with remote settings
                window.ipcRenderer.send('remoteMode-restart', headlessSettings);
            }
        }).catch((error) => {
            console.log(error.message);
        });
    }
};

export default actions;
