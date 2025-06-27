import config from '../services/configstore';
import {
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const CONFIG_KEY = 'jobStats';

const getJobStats = () => {
    const jobStats = config.get(CONFIG_KEY, { totalRuntime: 0, totalJobs: 0, jobsCompleted: 0, jobsCancelled: 0, jobs: [] });

    if (!jobStats.jobs) {
        jobStats.jobs = [];
    }

    return jobStats;
};

export const fetch = (req, res) => {
    const jobStats = getJobStats();
    res.send(jobStats);
};

export const update = (req, res) => {
    const jobStats = req.body;
    try {
        config.set(CONFIG_KEY, jobStats);
        res.send({ message: 'job stats saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(jobStats.rcfile)
        });
    }
};
