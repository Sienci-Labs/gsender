import { homeMachine } from 'app/features/DRO/utils/DRO';
import { cancelJog } from 'app/features/Jogging/utils/Jogging';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { useDroGating } from '../../../hooks/useDroGating';
import type { CarveMode } from '../carveMode';
import StatusBadge from './StatusBadge';
import TopBarClock from './TopBarClock';

export default function CarveTopBar({ mode }: { mode: CarveMode }) {
    const { isConnected, canHome } = useDroGating();
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );
    const controllerType = useTypedSelector(
        (s: RootState) => s.controller.type,
    );

    const handleEStop = () => {
        if (!isConnected) return;
        cancelJog(activeState as any, controllerType);
    };

    return (
        <header className="relative flex items-center justify-between h-12 px-2.5 border-b border-outline-subtle bg-surface-base shrink-0 select-none drag-region">
            <div className="no-drag">
                <StatusBadge mode={mode} />
            </div>
            <TopBarClock mode={mode} />
            <div className="flex items-center gap-1.5 no-drag">
                <button
                    type="button"
                    onClick={homeMachine}
                    disabled={!canHome}
                    className={cn(
                        'h-[30px] px-2.5 rounded-md border font-mono text-[9.5px] font-semibold tracking-[0.06em] uppercase transition-colors',
                        canHome
                            ? 'bg-blue-600 border-transparent text-white active:bg-blue-700'
                            : 'bg-transparent border-outline-strong text-content-disabled',
                    )}
                >
                    Home
                </button>
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
