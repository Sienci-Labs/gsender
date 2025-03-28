import { useContext } from 'react';
import { Job, StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { truncatePort } from 'app/features/Stats/utils/statUtils.ts';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

interface StatusAggregate {
    [key: string]: number;
}

function aggregateJobsByStatus(jobs: Job[]) {
    const finishedJobs: StatusAggregate = {};
    const incompleteJobs: StatusAggregate = {};
    jobs.forEach((job) => {
        if (job.jobStatus === 'COMPLETE') {
            if (!finishedJobs.hasOwnProperty(job.port)) {
                finishedJobs[job.port] = 0;
            }
            finishedJobs[job.port] += 1;
        } else {
            if (!incompleteJobs.hasOwnProperty(job.port)) {
                incompleteJobs[job.port] = 0;
            }
            incompleteJobs[job.port] += 1;
        }
    });
    return [finishedJobs, incompleteJobs];
}

export function JobResultsChart() {
    const { jobs } = useContext(StatContext);
    const [finished, unfinished] = aggregateJobsByStatus(jobs);
    const ports = Object.keys(finished);
    const labels = ports.map((p) => truncatePort(p));
    const finishedJobData = Object.values(finished);
    const incompleteJobData = Object.values(unfinished);

    const data = {
        labels,
        datasets: [
            {
                label: 'Complete',
                data: finishedJobData,
                backgroundColor: '#659dd2',
            },
            {
                label: 'Incomplete',
                data: incompleteJobData,
                backgroundColor: '#C7813F',
            },
        ],
    };

    const options = {
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };

    return <Bar data={data} options={options} className="dark:text-white" />;
}
