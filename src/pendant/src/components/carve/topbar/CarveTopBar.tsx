import cn from 'classnames';
import { OctagonX } from 'lucide-react';
import { useEStop } from '../../../hooks/useEStop';
import HomeCTA from '../../HomeCTA';
import IncomingFilePill from '../../IncomingFilePill';
import type { CarveMode } from '../carveMode';
import StatusBadge from './StatusBadge';
import TopBarClock from './TopBarClock';

export default function CarveTopBar({ mode }: { mode: CarveMode }) {
    const { isConnected, eStop: handleEStop } = useEStop();

    return (
        <header className="relative flex items-center justify-between h-14 px-2.5 border-b border-outline-subtle bg-surface-base shrink-0 select-none drag-region">
            <div className="flex items-center gap-1.5 no-drag">
                <StatusBadge mode={mode} />
                {/* Left side, well away from E-STOP */}
                <HomeCTA className="h-[38px] px-4 text-[12px] ml-1.5" />
            </div>
            <TopBarClock mode={mode} />
            <div className="flex items-center gap-1.5 no-drag">
                <IncomingFilePill />
                <button
                    type="button"
                    onClick={handleEStop}
                    disabled={!isConnected}
                    className={cn(
                        'h-11 min-w-[120px] px-4 gap-2 rounded-md font-mono text-[14px] font-bold tracking-[0.07em] uppercase flex items-center justify-center transition-[colors,transform] duration-75',
                        isConnected
                            ? 'bg-action-stop text-white ring-1 ring-red-400/40 shadow-[0_2px_8px_rgba(220,38,38,0.35)] active:brightness-90 active:scale-[0.97]'
                            : 'bg-surface-disabled text-content-disabled',
                    )}
                    aria-label="Emergency stop"
                >
                    <OctagonX className="w-5 h-5 shrink-0" strokeWidth={2.25} />
                    E-STOP
                </button>
            </div>
        </header>
    );
}
