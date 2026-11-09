import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import _get from 'lodash/get';
import { useEffect, useRef, useState } from 'react';
import { layoutDepthGauge } from './depthGauge/layout';

const MONO =
    "ui-monospace, 'Cascadia Mono', Consolas, 'Roboto Mono', Menlo, monospace";

// Rounded so status reports that don't move Z don't re-render.
const round2 = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const px = (v: number) => `${v.toFixed(1)}px`;

// Z depth gauge overlaid on the right edge of the visualizer: the machine's Z
// travel as a rail, the job's Z extent as a band on it, and the current Z as a
// chip. Labels are work Z. See depthGauge/layout.ts for the frame.
export default function DepthGauge() {
    const rootRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const homed = useTypedSelector(
        (s: RootState) =>
            !!s.controller.hasHomed &&
            Number(_get(s, 'controller.settings.settings.$22', 0)) > 0,
    );
    const travel = useTypedSelector((s: RootState) => {
        const v = Number(_get(s, 'controller.settings.settings.$132'));
        return Number.isFinite(v) ? v : null;
    });
    const workZ = useTypedSelector((s: RootState) =>
        round2(s.controller.wpos?.z),
    );
    const wcoZ = useTypedSelector((s: RootState) =>
        round2(s.controller.wco?.z),
    );
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const jobTop = useTypedSelector((s: RootState) =>
        round2(s.file.bbox?.max?.z),
    );
    const jobBottom = useTypedSelector((s: RootState) =>
        round2(s.file.bbox?.min?.z),
    );

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        setHeight(el.clientHeight);
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setHeight(el.clientHeight));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const layout =
        height > 0
            ? layoutDepthGauge({
                  height,
                  homed,
                  travel,
                  workZ,
                  wcoZ,
                  job: fileLoaded ? { top: jobTop, bottom: jobBottom } : null,
              })
            : null;

    return (
        <div
            ref={rootRef}
            className="absolute right-3 top-0 bottom-0 w-16 pointer-events-none select-none"
            aria-hidden="true"
        >
            {isConnected && layout && (
                <>
                    {layout.dimmed && (
                        <div className="absolute right-0 top-1.5 text-[11px] leading-4 whitespace-nowrap text-gray-600 dark:text-content-muted">
                            Not homed
                        </div>
                    )}
                    {layout.ends && (
                        <>
                            <div
                                className="absolute left-6 w-12 text-center text-xs leading-4 text-gray-600 dark:text-content-muted"
                                style={{
                                    top: px(layout.ends.top.top),
                                    fontFamily: MONO,
                                }}
                            >
                                {layout.ends.top.text}
                            </div>
                            <div
                                className="absolute left-6 w-12 text-center text-xs leading-4 text-gray-600 dark:text-content-muted"
                                style={{
                                    top: px(layout.ends.bottom.top),
                                    fontFamily: MONO,
                                }}
                            >
                                {layout.ends.bottom.text}
                            </div>
                        </>
                    )}

                    <div
                        className={`absolute left-[46px] w-1 rounded-full bg-gray-200 dark:bg-outline-subtle ${layout.dimmed ? 'opacity-40' : ''}`}
                        style={{
                            top: px(layout.track.top),
                            height: px(layout.track.height),
                        }}
                    />
                    {layout.ticks.map((top) => (
                        <div
                            key={top}
                            className="absolute left-[53px] w-1 h-px bg-gray-300 dark:bg-outline"
                            style={{ top: px(top) }}
                        />
                    ))}

                    {layout.job && (
                        <>
                            <div
                                className="absolute left-[44px] w-2 rounded-full bg-blue-500"
                                style={{
                                    top: px(layout.job.top),
                                    height: px(layout.job.height),
                                }}
                            />
                            {layout.job.topLabel && (
                                <div
                                    className="absolute -left-4 w-14 text-right text-xs leading-4 text-blue-600 dark:text-blue-400"
                                    style={{
                                        top: px(layout.job.topLabel.top),
                                        fontFamily: MONO,
                                    }}
                                >
                                    {layout.job.topLabel.text}
                                </div>
                            )}
                            {layout.job.bottomLabel && (
                                <div
                                    className="absolute -left-4 w-14 text-right text-xs leading-4 text-blue-600 dark:text-blue-400"
                                    style={{
                                        top: px(layout.job.bottomLabel.top),
                                        fontFamily: MONO,
                                    }}
                                >
                                    {layout.job.bottomLabel.text}
                                </div>
                            )}
                        </>
                    )}

                    <div
                        className="absolute left-[30px] w-[30px] h-0.5 bg-gray-900 dark:bg-content-primary"
                        style={{ top: px(layout.current.line) }}
                    />
                    <div
                        className="absolute -left-[52px] w-[86px] h-7 flex items-center justify-center gap-1.5 rounded backdrop-blur-md bg-white/35 dark:bg-surface-elevated/[0.24] shadow-[0_6px_16px_rgba(17,24,39,0.12)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                        style={{ top: px(layout.current.chip) }}
                    >
                        <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">
                            Z
                        </span>
                        <span
                            className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-content-primary [text-shadow:0_1px_0_rgba(255,255,255,0.8)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
                            style={{ fontFamily: MONO }}
                        >
                            {layout.current.text}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
