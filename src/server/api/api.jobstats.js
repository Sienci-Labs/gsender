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
    const reqJobStats = req.body;
    const jobStats = getJobStats();

    let newJobStats = jobStats;
    if (reqJobStats.finishTime) {
        newJobStats.jobsCompleted += 1;
    } else {
        newJobStats.jobsCancelled += 1;
    }
    newJobStats.totalJobs += 1;
    newJobStats.totalRuntime += reqJobStats.timeRunning;
    newJobStats.jobs.push(reqJobStats.job);

    try {
        config.set(CONFIG_KEY, newJobStats);
        res.send({ message: 'job stats saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(jobStats.rcfile)
        });
    }
};
