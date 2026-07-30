import {
    Job,
    JobAggregate,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { truncatePort } from 'app/features/Stats/utils/statUtils.ts';

ChartJS.register(ArcElement, Tooltip, Legend);

function aggregateRunTime(jobs: Job[]): [string[], number[]] {
    const aggregate: JobAggregate = {};
    jobs.map((job) => {
        if (!aggregate.hasOwnProperty(job.port)) {
            aggregate[job.port] = job.duration;
            return;
        }
        aggregate[job.port] += job.duration;
    });

    return [Object.keys(aggregate), Object.values(aggregate)];
}

export function RunTimePerComPort() {
    const { jobs } = useContext(StatContext);

    const [ports, runtimes] = aggregateRunTime(jobs);

    runtimes.map((runtime) => runtime / 1000);
    let labels = ports.map((p) => truncatePort(p));

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Hours per port',
                data: runtimes,
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
        <div className="w-52 h-52">
            <Doughnut
                data={data}
                width={280}
                height={280}
                options={{
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (d) => {
                                    return `${d.raw} hours`;
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
}
