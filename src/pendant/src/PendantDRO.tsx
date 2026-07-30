import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

const AXES = ['X', 'Y', 'Z'] as const;
type Axis = (typeof AXES)[number];

function AxisRow({ axis, value }: { axis: Axis; value: string }) {
    return (
        <div className="flex items-center gap-6 px-6 py-5 border-b border-gray-700 last:border-0">
            <span className="w-10 text-3xl font-bold text-blue-400 select-none">{axis}</span>
            <span className="flex-1 text-right font-mono text-5xl tabular-nums tracking-tight text-white">
                {Number(value).toFixed(3)}
            </span>
        </div>
    );
}

export default function PendantDRO() {
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
    const mpos = useTypedSelector((s: RootState) => s.controller.mpos);
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);

    const pos = wpos ?? mpos;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <span className="text-xl">Waiting for connection…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 pt-6 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Work Position
            </div>
            <div className="flex-1">
                {AXES.map((axis) => (
                    <AxisRow
                        key={axis}
                        axis={axis}
                        value={pos?.[axis.toLowerCase() as 'x' | 'y' | 'z'] ?? '0.000'}
                    />
                ))}
            </div>
        </div>
    );
}
