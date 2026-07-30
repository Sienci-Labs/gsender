import { useContext } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { ConfigRow } from 'app/features/Stats/components/Configuration.tsx';

export function StatRow({
    connected,
    label,
    value,
}: {
    connected: boolean;
    label: string;
    value: string | number;
}) {
    return (
        <ConfigRow connected={connected} label={label}>
            <b>{value}</b>
        </ConfigRow>
    );
}

function getTimeString(seconds: number): string {
    if (seconds === 0 || isNaN(Number(seconds))) {
        return '-';
    }
    seconds = seconds / 1000; // milliseconds to seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Number(((seconds % 3600) % 60).toFixed(0));
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

export function StatTable() {
    const { isConnected, jobStats } = useContext(StatContext);
    return (
        <div className="flex flex-col px-10">
            <StatRow
                connected={isConnected}
                label="Total jobs run"
                value={jobStats.completeJobs + jobStats.incompleteJobs}
            />
            <StatRow
                connected={isConnected}
                label="Total cutting time"
                value={getTimeString(jobStats.totalCutTime)}
            />
            <StatRow
                connected={isConnected}
                label="Average job time"
                value={getTimeString(jobStats.averageCutTime)}
            />
            <StatRow
                connected={isConnected}
                label="Longest job"
                value={getTimeString(jobStats.longestCutTime)}
            />
        </div>
    );
}
