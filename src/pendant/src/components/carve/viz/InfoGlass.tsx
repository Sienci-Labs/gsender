import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';

const UNITS_LABEL: Record<string, string> = { G20: 'in', G21: 'mm' };
const DIST_LABEL: Record<string, string> = { G90: 'abs', G91: 'inc' };
const MOTION_LABEL: Record<string, string> = {
    G0: 'rapid',
    G1: 'feed',
    G2: 'cw arc',
    G3: 'ccw arc',
    'G38.2': 'probe',
    'G38.3': 'probe',
    'G38.4': 'probe',
    'G38.5': 'probe',
    G80: 'off',
};
// Same pin keys InfoStrip reads from status.pinState
const PIN_KEYS = ['X', 'Y', 'Z', 'A', 'P', 'D', 'H'] as const;

function Field({ label, value }: { label: string; value: string }) {
    return (
        <span className="flex flex-col items-center gap-px shrink-0">
            <span className="font-mono text-[7.5px] tracking-[0.06em] uppercase text-content-primary/45">
                {label}
            </span>
            <span className="font-mono text-[10px] font-bold text-content-primary/95">
                {value}
            </span>
        </span>
    );
}

/** Modal state + asserted pins, as a glass chip over the visualizer. */
export default function InfoGlass() {
    const modal = useTypedSelector(
        (state: RootState) => state.controller.modal,
    );
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const pins = useTypedSelector(
        (state: RootState) =>
            (state.controller.state.status as any)?.pinState as
                | Record<string, boolean>
                | undefined,
    );

    const v = (value: string) => (isConnected ? value : '-');
    // Only pins the firmware reports as asserted; none means no pin segment
    const asserted = isConnected ? PIN_KEYS.filter((key) => !!pins?.[key]) : [];

    return (
        <div className="absolute right-2.5 top-2.5 max-w-[calc(100%-20px)] flex items-center gap-[9px] px-[9px] py-1.5 rounded-md border border-white/[0.09] bg-surface-base/[0.52] backdrop-blur-[11px] backdrop-saturate-[1.4] shadow-[0_3px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] pointer-events-none">
            <Field
                label="units"
                value={v(UNITS_LABEL[modal.units] ?? modal.units)}
            />
            <Field
                label="dist"
                value={v(DIST_LABEL[modal.distance] ?? modal.distance)}
            />
            <Field
                label="move"
                value={v(MOTION_LABEL[modal.motion] ?? modal.motion)}
            />
            {asserted.length > 0 && (
                <>
                    <span className="w-px self-stretch bg-white/[0.14] shrink-0" />
                    <span className="flex items-center gap-1.5 shrink-0">
                        {asserted.map((key) => (
                            <span
                                key={key}
                                className="flex flex-col items-center gap-0.5"
                                title={`${key}: asserted`}
                            >
                                <span className="w-1.5 h-1.5 rounded-[1.5px] bg-state-run shadow-[0_0_5px_rgba(5,150,105,0.75)]" />
                                <span className="font-mono text-[8px] font-bold text-content-primary/90">
                                    {key}
                                </span>
                            </span>
                        ))}
                    </span>
                </>
            )}
        </div>
    );
}
