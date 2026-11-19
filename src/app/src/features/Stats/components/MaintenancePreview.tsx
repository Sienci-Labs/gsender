import {
    StatContext,
    type MaintenanceTask as Task,
} from 'app/features/Stats/utils/StatContext.tsx';
import { type TranslationKey, useAppTranslation } from 'app/i18n';
import cx from 'classnames';
import { useContext } from 'react';
import { FaCircle } from 'react-icons/fa';
import { tv } from 'tailwind-variants';

function timeRemainingSortComparison(a: Task, b: Task) {
    const aTimeRemaining = a.rangeEnd - a.currentTime;
    const bTimeRemaining = b.rangeEnd - b.currentTime;

    if (aTimeRemaining < bTimeRemaining) return -1;
    if (aTimeRemaining > bTimeRemaining) return 1;
    return 0;
}

const reminderStyles = tv({
    base: 'text-3xl max-xl:text-xl flex flex-row gap-8 items-center font-bolt',
    variants: {
        color: {
            'Urgent!': 'text-red-500',
            Due: 'text-orange-500',
            Soon: 'text-robin-500',
            Low: 'text-green-500',
        },
    },
});

const reminderBGStyles = tv({
    base: 'bg-opacity-5',
    variants: {
        color: {
            'Urgent!': 'bg-red-500',
            Due: 'bg-orange-500',
            Soon: 'bg-robin-500',
            Low: 'bg-green-500',
        },
    },
});

// Display text for each reminder level (the levels are also style variants).
const reminderLabels: Record<string, TranslationKey> = {
    'Urgent!': 'stats:maintenance.status.urgent',
    Due: 'stats:maintenance.status.due',
    Soon: 'stats:maintenance.status.soon',
    Low: 'stats:maintenance.status.low',
};

function remainingTime(task: Task) {
    const { rangeStart, currentTime } = task;
    return rangeStart - Math.floor(currentTime);
}

function remainingTimeString(task: Task) {
    const { currentTime, rangeStart, rangeEnd } = task;
    if (currentTime > rangeEnd) {
        return 'Urgent!';
    } else if (currentTime >= rangeStart && currentTime <= rangeEnd) {
        return 'Due';
    } else if (currentTime >= rangeStart - 10 && currentTime < rangeStart) {
        return 'Soon';
    }
    return 'Low';
}

function MaintenanceTask({ task }: { task: Task }) {
    const { t } = useAppTranslation();
    const time = remainingTime(task);
    const reminderString = remainingTimeString(task);

    return (
        <div
            className={cx(
                'flex flex-row justify-between items-center bg-gray-50 rounded-2xl p-2',
                reminderBGStyles({ color: reminderString }),
            )}
        >
            <div className={'flex flex-col'}>
                <span className={reminderStyles({ color: reminderString })}>
                    {t('stats:maintenance.hoursShort', { time })}
                </span>
                <span className="text-gray-700 max-xl:text-sm dark:text-content-muted">
                    {task.name}
                </span>
            </div>
            <div className={reminderStyles({ color: reminderString })}>
                {t(reminderLabels[reminderString])}
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
