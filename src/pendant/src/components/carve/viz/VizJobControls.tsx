import { PAUSE, START, STOP } from 'app/constants';
import ControlButton from 'app/features/JobControl/ControlButton';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import get from 'lodash/get';
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
        <div className="absolute left-2.5 bottom-2.5 flex gap-[7px] p-1.5 rounded-md border border-outline-subtle bg-surface-sunken/[0.72] backdrop-blur-md">
            {/* Keyed so the slot remounts (and re-registers its shortcut) when
                it switches between Start and Pause */}
            <ControlButton
                key={slotType}
                type={slotType}
                labelOverride={slotLabel}
                {...sharedProps}
            />
            <ControlButton type={STOP} {...sharedProps} />
        </div>
    );
}
