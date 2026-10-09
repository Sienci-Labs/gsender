import {
    BACK_LEFT,
    BACK_RIGHT,
    CENTER,
    FRONT_LEFT,
    FRONT_RIGHT,
    getMovementGCode,
} from 'app/features/DRO/utils/RapidPosition';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import type { RootState } from 'app/store/redux';
import { clsx } from 'clsx';
import get from 'lodash/get';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHoldToActivate } from '../../hooks/useHoldToActivate';

// Rapid-to-corner pad shared by MovePanel and the carve Position tab.

const HOLD_MS = 700;
const SETTLE_MS = 900;

export type CornerId =
    | typeof FRONT_RIGHT
    | typeof FRONT_LEFT
    | typeof BACK_RIGHT
    | typeof BACK_LEFT
    | typeof CENTER;

export const CORNERS: {
    id: CornerId;
    label: string;
    position: string;
    size: number;
}[] = [
    {
        id: BACK_LEFT,
        label: 'Rear Left',
        position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
        size: 64,
    },
    {
        id: BACK_RIGHT,
        label: 'Rear Right',
        position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
        size: 64,
    },
    {
        id: FRONT_LEFT,
        label: 'Front Left',
        position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
        size: 64,
    },
    {
        id: FRONT_RIGHT,
        label: 'Front Right',
        position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
        size: 64,
    },
    {
        id: CENTER,
        label: 'Center',
        position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        size: 52,
    },
];

export function HoldCorner({
    corner,
    selected,
    disabled,
    onConfirm,
    size,
}: {
    corner: (typeof CORNERS)[number];
    selected: boolean;
    disabled: boolean;
    onConfirm: (id: CornerId) => void;
    /** Overrides the corner's own diameter (px). */
    size?: number;
}) {
    const [confirmed, setConfirmed] = useState(false);
    const [settling, setSettling] = useState(false);
    const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (settleTimeoutRef.current)
                clearTimeout(settleTimeoutRef.current);
        },
        [],
    );

    const { progress, holding, showProgress, hintNode, bind } =
        useHoldToActivate(
            () => {
                setConfirmed(true);
                setSettling(true);
                onConfirm(corner.id);
                settleTimeoutRef.current = setTimeout(() => {
                    setConfirmed(false);
                    setSettling(false);
                }, SETTLE_MS);
            },
            {
                durationMs: HOLD_MS,
                disabled: disabled || settling,
                hint: `Hold to rapid to ${corner.label.toLowerCase()}`,
            },
        );
    // The confirmed ring stays full while it settles
    const ring = confirmed ? 1 : progress;

    return (
        <button
            type="button"
            className={clsx(
                'absolute rounded-full border-2 flex items-center justify-center transition-transform touch-none select-none',
                corner.position,
                holding && 'scale-110',
                confirmed
                    ? 'border-green-500 bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400'
                    : selected
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-outline bg-white dark:bg-surface-elevated text-gray-600 dark:text-content-secondary',
            )}
            style={{
                width: size ?? corner.size,
                height: size ?? corner.size,
            }}
            disabled={disabled || settling}
            {...bind}
        >
            {(showProgress || confirmed) && (
                <span
                    aria-hidden="true"
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        inset: -6,
                        background: `conic-gradient(${confirmed ? '#22c55e' : '#689AC9'} ${ring * 360}deg, transparent 0deg)`,
                        WebkitMask:
                            'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
                    }}
                />
            )}
            <span className="text-[10px] font-bold uppercase leading-none z-10">
                {corner.id === CENTER ? 'CTR' : corner.id}
            </span>
            {hintNode}
        </button>
    );
}

/** Corner Select: hold a target to rapid there (requires homing). */
export function useCornerRapid(canCorner: boolean) {
    const homingFlag = useTypedSelector(
        (s: RootState) => s.controller.homingFlag,
    );
    const homingDirection = useTypedSelector((s: RootState) =>
        get(s, 'controller.settings.settings.$23', '0'),
    );
    const pullOff = useTypedSelector((s: RootState) =>
        Number(get(s, 'controller.settings.settings.$27', 1)),
    );

    const [selectedCorner, setSelectedCorner] = useState<CornerId>(CENTER);

    const handleConfirmCorner = useCallback(
        (id: CornerId) => {
            if (!canCorner) return;
            setSelectedCorner(id);
            const gcode = getMovementGCode(
                id,
                homingDirection,
                homingFlag,
                pullOff,
            );
            if (gcode.length) {
                controller.command('gcode', gcode);
            }
        },
        [canCorner, homingDirection, homingFlag, pullOff],
    );

    return { selectedCorner, handleConfirmCorner };
}
