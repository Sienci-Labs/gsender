import { FaCheckCircle } from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';
import cn from 'classnames';
import { tv } from 'tailwind-variants';

const statusBadge = tv({
    base: 'rounded-xl border bg-opacity-20 p-1 text-center',
    variants: {
        color: {
            Success: 'text-green-500 border-green-500 bg-green-500',
            Failed: 'text-red-500 border-red-500 bg-red-500',
        },
    },
});

function formatDuration(seconds: number) {
    return new Date(seconds).toISOString().slice(11, 19);
}

export function JobPreview({ file, jobStatus, duration }) {
    const jobComplete = jobStatus === 'COMPLETE';
    const statusMessage = jobComplete ? 'Success' : 'Failed';
    return (
        <div className="grid grid-cols-8 grid-rows-1 gap-4 items-center">
            <span
                className={cn({
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
