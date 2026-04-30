import { useState } from 'react';
import { Home, Target, Crosshair } from 'lucide-react';

const AXES = [
    { label: 'X', color: 'bg-red-500/20 text-red-400' },
    { label: 'Y', color: 'bg-green-500/20 text-green-400' },
    { label: 'Z', color: 'bg-blue-500/20 text-blue-400' },
] as const;

export default function DROCard() {
    const [mode, setMode] = useState<'work' | 'machine'>('work');

    return (
        <div className="rounded-xl bg-dark-darker border border-dark-lighter p-4 flex flex-col gap-3">
            {/* Work / Machine toggle */}
            <div className="flex gap-1 self-end">
                {(['work', 'machine'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors ${
                            mode === m
                                ? 'bg-robin-600 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Axis rows */}
            <div className="flex flex-col gap-2">
                {AXES.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-3 px-2 py-2 rounded-lg bg-dark">
                        <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold shrink-0 ${color}`}>
                            {label}
                        </span>
                        <span className="flex-1 text-right font-mono text-4xl tabular-nums text-white leading-none">
                            0.000
                        </span>
                        <button className="text-xs text-gray-500 hover:text-gray-300 border border-dark-lighter rounded px-2 py-1 shrink-0">
                            ZERO
                        </button>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                    { icon: Home, label: 'Home' },
                    { icon: Target, label: 'Goto Zero' },
                    { icon: Crosshair, label: 'Probe' },
                ].map(({ icon: Icon, label }) => (
                    <button key={label} className="flex items-center justify-center gap-1.5 border border-dark-lighter rounded-lg py-3 text-sm text-gray-300 hover:bg-dark-lighter hover:text-white">
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
