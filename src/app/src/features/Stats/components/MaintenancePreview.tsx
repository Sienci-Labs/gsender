import {
    MaintenanceTask as Task,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { FaCircle } from 'react-icons/fa';
import cx from 'classnames';
import { tv } from 'tailwind-variants';

function timeRemainingSortComparison(a: Task, b: Task) {
    const aTimeRemaining = a.rangeEnd - a.currentTime;
    const bTimeRemaining = b.rangeEnd - b.currentTime;

    if (aTimeRemaining < bTimeRemaining) return -1;
    if (aTimeRemaining > bTimeRemaining) return 1;
    return 0;
}

function remainingTime(task: Task) {
    return Math.floor(Number(task.rangeEnd) - Number(task.currentTime));
}

const reminderStyles = tv({
    base: 'text-3xl flex flex-row gap-8 items-center font-bolt',
    variants: {
        color: {
            Due: 'text-red-500',
            Soon: 'text-orange-500',
            Low: 'text-blue-500',
        },
    },
});

const reminderBGStyles = tv({
    base: 'bg-opacity-5',
    variants: {
        color: {
            Due: 'bg-red-500',
            Soon: 'bg-orange-500',
            Low: 'bg-robin-500',
        },
    },
});

function remainingTimeString(remainingTime: number) {
    const dueUpper = 4;
    const soonUpper = 20;

    if (remainingTime < dueUpper) {
        return 'Due';
    }
    if (remainingTime < soonUpper) {
        return 'Soon';
    }
    return 'Low';
}

function MaintenanceTask({ task }: { task: Task }) {
    const time = remainingTime(task);
    const reminderString = remainingTimeString(time);

    return (
        <div
            className={cx(
                'flex flex-row justify-between items-center bg-gray-50 rounded-2xl p-2',
                reminderBGStyles({ color: reminderString }),
            )}
        >
            <div className={'flex flex-col'}>
                <span className={reminderStyles({ color: reminderString })}>
                    {time} hours
                </span>
                <span className="text-gray-700 dark:text-gray-400">
                    {task.name}
                </span>
            </div>
            <div className={reminderStyles({ color: reminderString })}>
                {reminderString}
                <span className="">
                    <FaCircle />
                </span>
            </div>
        </div>
    );
}

export function MaintenancePreview({ limit = 3 }) {
    const { maintenanceTasks } = useContext(StatContext);
    // Sort tasks by remaining time and truncate to top 3
    const sortedTasks = maintenanceTasks
        .sort(timeRemainingSortComparison)
        .slice(0, limit);

    return (
        <div className="flex flex-col gap-2">
            {sortedTasks.map((task) => (
                <MaintenanceTask key={`task-${task.id}`} task={task} />
            ))}
        </div>
    );
}
