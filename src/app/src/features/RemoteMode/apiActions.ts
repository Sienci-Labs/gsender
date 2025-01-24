import api from 'app/api';
import isElectron from 'is-electron';

export interface HeadlessSettings {
    ip: string;
    port: number;
    headlessStatus: boolean;
}

const actions = {
    fetchSettings: async (
        setHeadlessSettings: (settings: HeadlessSettings) => void,
        setOldSettings: (settings: HeadlessSettings) => void,
    ) => {
        try {
            let res = await api.remoteSetting.fetch();
            const remote = res.data;
            setHeadlessSettings(remote);
            setOldSettings(remote);
        } catch (error) {
            console.log(error);
        }
    },
    saveSettings: async (headlessSettings: HeadlessSettings) => {
        await api.remoteSetting
            .update(headlessSettings)
            .then(() => {
                //App restart logic goes here
                if (isElectron()) {
                    //call the event that handles app restart with remote settings
                    // @ts-ignore
                    window.ipcRenderer.send(
                        'remoteMode-restart',
                        headlessSettings,
                    );
                }
            })
            .catch((error) => {
                console.log(error.message);
            });
    },
};

export default actions;
