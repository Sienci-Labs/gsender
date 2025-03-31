import { FaCheckCircle } from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';
import cn from 'classnames';
import { tv } from 'tailwind-variants';
import { JOB_STATUS_T } from '../utils/StatContext';

const statusBadge = tv({
    base: 'rounded-xl border bg-opacity-20 p-1 text-center',
    variants: {
        color: {
            Finished: 'text-green-500 border-green-500 bg-green-500',
            Incomplete: 'text-red-500 border-red-500 bg-red-500',
        },
    },
});

function formatDuration(seconds: number) {
    return new Date(seconds).toISOString().slice(11, 19);
}

export function JobPreview({
    file,
    jobStatus,
    duration,
}: {
    file: string;
    jobStatus: JOB_STATUS_T;
    duration: number;
}) {
    const jobComplete = jobStatus === 'COMPLETE';
    const statusMessage = jobComplete ? 'Finished' : 'Incomplete';
    return (
        <div className="grid grid-cols-8 grid-rows-1 gap-4 items-center dark:text-white">
            <span
                className={cn('opacity-70', {
                    'text-red-500': !jobComplete,
                    'text-green-500': jobComplete,
                })}
            >
                {jobStatus === 'COMPLETE' ? (
                    <FaCheckCircle />
                ) : (
                    <FaCircleXmark />
                )}
            </span>
            <span className="col-span-3 truncate font-bold">{file}</span>
            <span className="col-span-2 text-right">
                {formatDuration(Number(duration))}
            </span>
            <span className="col-span-2">
                <div
                    className={statusBadge({
                        color: statusMessage,
                    })}
                >
                    {statusMessage}
                </div>
            </span>
        </div>
    );
}
