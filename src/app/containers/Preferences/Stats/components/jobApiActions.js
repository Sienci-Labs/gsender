import api from 'app/api';

const actions = {
    fetch: async (setData, setJobsFinished, setJobsCancelled) => {
        try {
            let res = await api.jobStats.fetch();
            const { jobs, jobsFinished, jobsCancelled } = res.body;
            setData(jobs);
            setJobsFinished(jobsFinished);
            setJobsCancelled(jobsCancelled);
        } catch (error) {
            console.log(error);
        }
    },
};

export default actions;
