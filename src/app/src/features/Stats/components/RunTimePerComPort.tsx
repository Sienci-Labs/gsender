import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function aggregateRunTime(jobs) {
    const aggregate = {};
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
    console.log(ports);
    console.log(runtimes);

    const data = {
        labels: ports,
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
        <div>
            <Doughnut
                data={data}
                width={300}
                height={300}
                options={{ maintainAspectRatio: false }}
            />
        </div>
    );
}
