import { usePostHog } from '@posthog/react';
import {
    GRBL_ACTIVE_STATE_IDLE,
    PAUSE,
    START,
    STOP,
    WORKFLOW_STATE_IDLE,
} from 'app/constants';
import { runOutline } from 'app/features/JobControl/OutlineButton';
import ControlButton from 'app/features/JobControl/ControlButton';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cx from 'classnames';
import get from 'lodash/get';
import { ScanLine } from 'lucide-react';
import type { JSX } from 'react';
import type { CarveMode } from '../carveMode';

// Same stub JobControls.tsx passes today
const validateATC = (): [
    boolean,
    { type: string; title: string; body: JSX.Element },
] => [false, { type: '', title: '', body: <span /> }];

const onStop = () => {};

/** One job slot (Start / Pause / Resume) next to a constant Stop. */
export default function VizJobControls({ mode }: { mode: CarveMode }) {
    const posthog = usePostHog();
    const workflow = useTypedSelector((s: RootState) =>
        get(s, 'controller.workflow'),
    );
    const activeState = useTypedSelector((s: RootState) =>
        get(s, 'controller.state.status.activeState'),
    );
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const fileLoaded = useTypedSelector((s: RootState) =>
        get(s, 'file.fileLoaded', false),
    );

    const visible =
        mode === 'running' ||
        mode === 'holdJob' ||
        ((mode === 'setup' || mode === 'disconnected') && fileLoaded);
    if (!visible) return null;

    // Outline only sits in the row before a job starts; same enable rule as
    // the desktop JobControl Outline button
    const showOutline = mode === 'setup' && fileLoaded;
    const outlineDisabled =
        !isConnected ||
        workflow?.state !== WORKFLOW_STATE_IDLE ||
        activeState !== GRBL_ACTIVE_STATE_IDLE;

    const slotType = mode === 'running' ? PAUSE : START;
    const slotLabel =
        mode === 'running' ? 'Pause' : mode === 'holdJob' ? 'Resume' : 'Start';

    const sharedProps = {
        workflow,
        activeState,
        isConnected,
        fileLoaded,
        onStop,
        validateATC,
        variant: 'pendantCompact' as const,
    };

    return (
        <div className="absolute left-2.5 bottom-2.5 flex gap-3 p-2 rounded-md border border-outline-subtle bg-surface-sunken/[0.72] backdrop-blur-md">
            {/* Keyed so the slot remounts (and re-registers its shortcut) when
                it switches between Start and Pause */}
            <ControlButton
                key={slotType}
                type={slotType}
                labelOverride={slotLabel}
                {...sharedProps}
            />
            <ControlButton type={STOP} {...sharedProps} />
            {showOutline && (
                <button
                    type="button"
                    disabled={outlineDisabled}
                    // The pendant has no visualizer outline handler, so it
                    // always uses the outline worker
                    onClick={() => runOutline(posthog, { liteMode: true })}
                    className={cx(
                        'flex items-center justify-center gap-2 w-[100px] h-[50px] shrink-0 rounded-md border font-mono text-[12.5px] font-bold uppercase tracking-[0.05em] transition-[colors,transform] duration-75 enabled:active:scale-[0.96]',
                        outlineDisabled
                            ? 'bg-surface-raised border-outline-subtle text-content-disabled cursor-not-allowed'
                            : 'bg-surface-elevated border-outline-strong text-content-primary',
                    )}
                >
                    <ScanLine className="w-[18px] h-[18px]" />
                    <span>Outline</span>
                </button>
            )}
        </div>
    );
}
