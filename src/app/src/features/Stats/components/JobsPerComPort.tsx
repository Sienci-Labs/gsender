import {
    Job,
    JobAggregate,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { truncatePort } from 'app/features/Stats/utils/statUtils.ts';

ChartJS.register(ArcElement, Tooltip, Legend);

function aggregatePortInfo(jobs: Job[]): [string[], number[]] {
    const jobAggregate: JobAggregate = {};
    jobs.forEach((job) => {
        if (!jobAggregate.hasOwnProperty(job.port)) {
            jobAggregate[job.port] = 1;
            return;
        }
        jobAggregate[job.port] = jobAggregate[job.port] + 1;
    });

    return [Object.keys(jobAggregate), Object.values(jobAggregate)];
}

export function JobsPerComPort() {
    const { jobs } = useContext(StatContext);
    const [ports, jobData] = aggregatePortInfo(jobs);

    const labels = ports.map((p) => truncatePort(p));

    const data = {
        labels,
        datasets: [
            {
                label: 'Jobs',
                data: jobData,
                backgroundColor: [
                    '#7ca7d0',
                    '#dc2626',
                    '#bb6a0c',
                    '#3F85C7',
                    '#059669',
                    '#22415e',
                ],
            },
        ],
    };

    return (
        <div>
            <Pie
                data={data}
                width={280}
                height={280}
                options={{ maintainAspectRatio: false }}
            />
        </div>
    );
}
