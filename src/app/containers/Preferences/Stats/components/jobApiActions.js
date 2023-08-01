import api from 'app/api';

const actions = {
    fetch: async (setData, setJobsFinished, setJobsCancelled) => {
        try {
            let res = await api.remoteSetting.fetch();
            const { jobs, jobsFinished, jobsCancelled } = res.body;
            setData(jobs);
            setJobsFinished(jobsFinished);
            setJobsCancelled(jobsCancelled);
        } catch (error) {
            console.log(error);
        }
    },
    // saveSettings: async (headlessSettings) => {
    //     await api.remoteSetting.update(headlessSettings).then(() => {
    //         //App restart logic goes here
    //         if (isElectron()) {
    //         //call the event that handles app restart with remote settings
    //             window.ipcRenderer.send('remoteMode-restart', headlessSettings);
    //         }
    //     }).catch((error) => {
    //         console.log(error.message);
    //     });
    // }
};

export default actions;
