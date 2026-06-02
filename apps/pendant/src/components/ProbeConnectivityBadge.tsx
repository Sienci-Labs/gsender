import { clsx } from 'clsx';

interface Props {
    isConnected: boolean;
    probeActive: boolean;
    className?: string;
}

export default function ProbeConnectivityBadge({ isConnected, probeActive, className }: Props) {
    if (!isConnected) return null;
    return (
        <div className={clsx(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'bg-white/90 dark:bg-dark/90 border border-gray-200 dark:border-dark-lighter',
            'text-[10px] font-semibold shadow-sm',
            className,
        )}>
            <div className={clsx(
                'w-2 h-2 rounded-full shrink-0',
                probeActive ? 'bg-green-500 animate-pulse' : 'bg-red-500',
            )} />
            <span className={probeActive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                {probeActive ? 'Active' : 'No Touch'}
            </span>
        </div>
    );
}
