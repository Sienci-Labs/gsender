import {
    BACK_LEFT,
    BACK_RIGHT,
    CENTER,
    FRONT_LEFT,
    FRONT_RIGHT,
} from 'app/features/DRO/utils/RapidPosition';
import { buildMachineBedOptions } from 'app/features/Visualizer/viewerOptions';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useDroGating } from '../../../hooks/useDroGating';
import {
    CORNERS,
    type CornerId,
    HoldCorner,
    useCornerRapid,
} from '../../move/cornerRapid';
import { selectMachineBedKey, type VisualizerHandle } from '../../Visualizer';

const TARGET_PX = 44;
// A target this close to (or past) the stage edge isn't worth showing
const EDGE_MARGIN_PX = 16;
// Corners sit at a 0x0 anchor on the projected point
const ANCHORED = 'left-0 top-0 -translate-x-1/2 -translate-y-1/2';

type Point = { x: number; y: number };

/**
 * Corner-rapid targets drawn on the machine bed's real corners (and centre):
 * hold one to rapid there. Shown under the same rule as the bed itself -
 * homing enabled and the machine homed (buildMachineBedOptions) - and they
 * track the visualizer's pan/zoom.
 */
export default function VizCornerTargets({
    visualizerRef,
    hidden,
}: {
    visualizerRef: RefObject<VisualizerHandle>;
    hidden: boolean;
}) {
    const machineBedKey = useTypedSelector(selectMachineBedKey);
    const hasHomed = useTypedSelector((s: RootState) => s.controller.hasHomed);
    const { canGoTo } = useDroGating();
    const canCorner = canGoTo && hasHomed;
    const { selectedCorner, handleConfirmCorner } = useCornerRapid(canCorner);

    // buildMachineBedOptions reads the store; the key tracks its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const bed = useMemo(
        () => buildMachineBedOptions({ ignoreUserToggle: true }),
        [machineBedKey],
    );

    const targets = useMemo(() => {
        if (!bed.visible || !bed.min || !bed.max) return null;
        const { min, max } = bed;
        return {
            [BACK_LEFT]: { x: min.x, y: max.y },
            [BACK_RIGHT]: { x: max.x, y: max.y },
            [FRONT_LEFT]: { x: min.x, y: min.y },
            [FRONT_RIGHT]: { x: max.x, y: min.y },
            [CENTER]: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2 },
        } as Record<CornerId, Point>;
    }, [bed]);

    const rootRef = useRef<HTMLDivElement>(null);
    const [screen, setScreen] = useState<Partial<Record<CornerId, Point>>>(
        {},
    );
    const active = targets !== null && !hidden;

    // Polls rather than listening for camera events: gviewer exposes none,
    // and its damped pan/zoom keeps moving after the gesture ends.
    useEffect(() => {
        if (!active || !targets) {
            setScreen({});
            return undefined;
        }
        let frame = 0;
        let last: Partial<Record<CornerId, Point>> = {};
        const tick = () => {
            const root = rootRef.current;
            const viz = visualizerRef.current;
            if (root && viz) {
                const rect = root.getBoundingClientRect();
                const next: Partial<Record<CornerId, Point>> = {};
                for (const [id, world] of Object.entries(targets) as [
                    CornerId,
                    Point,
                ][]) {
                    const p = viz.worldToScreen(world.x, world.y);
                    if (!p) continue;
                    const x = p.x - rect.left;
                    const y = p.y - rect.top;
                    if (
                        x < EDGE_MARGIN_PX ||
                        y < EDGE_MARGIN_PX ||
                        x > rect.width - EDGE_MARGIN_PX ||
                        y > rect.height - EDGE_MARGIN_PX
                    ) {
                        continue;
                    }
                    next[id] = { x, y };
                }
                if (changed(last, next)) {
                    last = next;
                    setScreen(next);
                }
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active, targets, visualizerRef]);

    if (!active) return null;

    return (
        <div ref={rootRef} className="absolute inset-0 pointer-events-none">
            {CORNERS.map((corner) => {
                const point = screen[corner.id];
                if (!point) return null;
                return (
                    <div
                        key={corner.id}
                        className="absolute w-0 h-0 pointer-events-auto"
                        style={{ left: point.x, top: point.y }}
                    >
                        <HoldCorner
                            corner={{ ...corner, position: ANCHORED }}
                            selected={selectedCorner === corner.id}
                            disabled={!canCorner}
                            onConfirm={handleConfirmCorner}
                            size={TARGET_PX}
                            bigRing
                        />
                    </div>
                );
            })}
        </div>
    );
}

function changed(
    a: Partial<Record<CornerId, Point>>,
    b: Partial<Record<CornerId, Point>>,
) {
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<CornerId>;
    for (const id of ids) {
        const p = a[id];
        const q = b[id];
        if (!p || !q) return true;
        if (Math.abs(p.x - q.x) >= 0.5 || Math.abs(p.y - q.y) >= 0.5) {
            return true;
        }
    }
    return false;
}
