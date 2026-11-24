import cn from 'classnames';
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
                        'h-[38px] px-[13px] rounded-md font-mono text-[10.5px] font-semibold tracking-[0.07em] uppercase flex items-center justify-center transition-colors',
                        isConnected
                            ? 'bg-action-stop text-white active:brightness-90'
                            : 'bg-surface-disabled text-content-disabled',
                    )}
                >
                    E-STOP
                </button>
            </div>
        </header>
    );
}
