import { Job, JobStats } from 'app/features/Stats/utils/StatContext.tsx';
import { JOB_STATUS } from 'app/constants';

export function truncatePort(port: string) {
    if (!port) {
        return;
    }
    return port.slice(-6);
}

export function filterJobsByPort(jobs: Job[] = [], port: string) {
    return jobs.filter((job) => job.port === port);
}

export function calculateJobStats(jobs: Job[] = []): JobStats {
    let completeJobs = 0;
    let incompleteJobs = 0;
    let totalCutTime: number = 0;
    let averageCutTime: number = 0;
    let longestCutTime = 0;

    jobs.forEach((job) => {
        totalCutTime += job.duration;
        if (job.jobStatus === JOB_STATUS.COMPLETE) {
            completeJobs++;
        } else {
            incompleteJobs++;
        }
        if (job.duration > longestCutTime) {
            longestCutTime = job.duration;
        }
    });

    averageCutTime = Number((totalCutTime / jobs.length).toFixed(0));

    return {
        completeJobs,
        incompleteJobs,
        totalCutTime,
        averageCutTime,
        longestCutTime,
    };
}
