import api from 'app/api';

const actions = {
    fetch: async (
        setData,
        setJobsFinished,
        setJobsCancelled,
        setTotalRuntime,
    ) => {
        try {
            let res = await api.jobStats.fetch();
            const { jobs, jobsFinished, jobsCancelled, totalRuntime } =
                res.body;
            setData && setData(jobs);
            setJobsFinished && setJobsFinished(jobsFinished);
            setJobsCancelled && setJobsCancelled(jobsCancelled);
            setTotalRuntime && setTotalRuntime(totalRuntime);
            return res.body;
        } catch (error) {
            console.log(error);
        }
        return null;
    },
};

export default actions;
