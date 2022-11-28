import api from 'app/api';

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
        await api.remoteSetting.update(headlessSettings).catch((error) => {
            console.log(error.message);
        });
    }
};

export default actions;
