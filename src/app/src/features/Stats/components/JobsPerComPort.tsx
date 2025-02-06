import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';

function aggregatePortInfo(jobs) {
    const jobAggregate = {};
    jobs.forEach((job) => {
        if (!jobAggregate.hasOwnProperty(job.port)) {
            jobAggregate[job.port] = 1;
            return;
        }
        jobAggregate[job.port] = jobAggregate[job.port] + 1;
    });
    console.log(jobAggregate);
    return [Object.keys(jobAggregate), Object.values(jobAggregate)];
}

export function JobsPerComPort() {
    const { jobs } = useContext(StatContext);
    const [labels, data] = aggregatePortInfo(jobs);
    console.log(labels);
    console.log(data);
    return <div>hi</div>;
}
