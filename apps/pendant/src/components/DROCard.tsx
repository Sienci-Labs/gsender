import { useState } from 'react';
import { Home, Target, Crosshair } from 'lucide-react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

const AXES = [
    { label: 'X', color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    { label: 'Y', color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
    { label: 'Z', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
] as const;

function formatAxisValue(value: unknown): string {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(3) : '0.000';
}

export default function DROCard() {
    const [mode, setMode] = useState<'work' | 'machine'>('work');
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
    const mpos = useTypedSelector((s: RootState) => s.controller.mpos);
    const activePos = mode === 'machine' ? mpos : wpos;

    return (
        <div className="rounded-xl bg-white border border-gray-200 dark:bg-dark-darker dark:border-dark-lighter p-3 flex flex-col gap-3">
            {/* Work / Machine toggle */}
            <div className="flex gap-1 self-end">
                {(['work', 'machine'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors ${
                            mode === m
                                ? 'bg-robin-500 text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Axis rows */}
            <div className="flex flex-col gap-1.5">
                {AXES.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 dark:bg-dark">
                        <button
                            type="button"
                            aria-label={`Go to ${label} axis`}
                            className={`w-9 h-9 rounded flex items-center justify-center text-base font-bold shrink-0 transition-colors hover:brightness-95 active:brightness-90 ${color}`}
                        >
                            {label}
                        </button>
                        <span className="flex-1 min-w-0 text-right font-mono text-[2.25rem] tabular-nums text-gray-900 dark:text-white leading-tight">
                            {formatAxisValue(activePos?.[label.toLowerCase() as 'x' | 'y' | 'z'])}
                        </span>
                        <button className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border border-gray-200 dark:border-dark-lighter rounded px-2 py-1 shrink-0">
                            ZERO
                        </button>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                    { icon: Home, label: 'Home', primary: true },
                    { icon: Target, label: 'Go to XY', primary: true },
                    { icon: Crosshair, label: 'Zero All', primary: false },
                ].map(({ icon: Icon, label, primary }) => (
                    <button
                        key={label}
                        disabled={primary && !isConnected}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-3 text-sm border transition-colors ${
                            primary
                                ? (isConnected
                                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 border-blue-500 text-white'
                                    : 'bg-gray-200 border-gray-200 text-gray-400 dark:bg-dark-lighter dark:border-dark-lighter dark:text-gray-500')
                                : 'border-gray-200 dark:border-dark-lighter text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-lighter hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
