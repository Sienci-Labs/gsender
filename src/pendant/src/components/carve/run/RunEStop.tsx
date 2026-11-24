import cn from 'classnames';
import { OctagonX } from 'lucide-react';
import { useEStop } from '../../../hooks/useEStop';

/** Large, easy-to-hit E-STOP for the run panel; same action as the top bar. */
export default function RunEStop({ className }: { className?: string }) {
    const { isConnected, eStop } = useEStop();

    return (
        <button
            type="button"
            onClick={eStop}
            disabled={!isConnected}
            aria-label="Emergency stop"
            className={cn(
                'shrink-0 w-full h-24 rounded-lg flex items-center justify-center gap-4 font-mono text-2xl font-bold tracking-[0.08em] uppercase transition-colors select-none',
                isConnected
                    ? 'bg-action-stop text-white active:brightness-90'
                    : 'bg-surface-disabled text-content-disabled',
                className,
            )}
        >
            <OctagonX className="w-14 h-14 shrink-0" strokeWidth={2.25} />
            E-STOP
        </button>
    );
}
