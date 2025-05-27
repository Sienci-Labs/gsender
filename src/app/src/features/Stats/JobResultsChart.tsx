import { useContext } from 'react';
import { Job, StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaChartPie } from 'react-icons/fa';
ChartJS.register(ArcElement, Tooltip, Legend);

export function EmptyDataPlaceholder() {
    return (
        <div className="flex flex-col gap-2 items-center justify-center text-gray-700 dark:text-white">
            <span className="text-6xl">
                <FaChartPie />
            </span>
            <span>No data to display</span>
        </div>
    );
}

export function JobResultsChart() {
    const { jobStats, filteredJobs, isConnected } = useContext(StatContext);

    const labels = ['Complete', 'Incomplete'];

    const data = {
        labels,
        datasets: [
            {
                label: 'Jobs',
                data: [jobStats.completeJobs, jobStats.incompleteJobs],
                backgroundColor: ['#659dd2', '#C7813F'],
            },
        ],
    };

    return (
        <div className={'w-full h-52 flex items-center justify-center'}>
            {(!isConnected || filteredJobs.length === 0) && (
                <EmptyDataPlaceholder />
            )}
            {isConnected && filteredJobs.length > 0 && <Pie data={data} />}
        </div>
    );
}
/*const { jobs } = useContext(StatContext);
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

    return (
            <Bar data={data} options={options} className="dark:text-white" />
        </div>
    );
}
*/
