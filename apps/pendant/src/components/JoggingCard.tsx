import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

const STEP_PRESETS = [
    { id: 'precise', label: 'Precise', value: '0.1' },
    { id: 'normal', label: 'Normal', value: '1.0' },
    { id: 'rapid', label: 'Rapid', value: '10' },
] as const;

export default function JoggingCard() {
    const [stepPreset, setStepPreset] = useState<(typeof STEP_PRESETS)[number]['id']>('normal');

    return (
        <div className="rounded-xl bg-white border border-gray-200 dark:bg-dark-darker dark:border-dark-lighter p-4 flex flex-col gap-3">
            {/* Step size selector */}
            <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Step:</span>
                {STEP_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setStepPreset(preset.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            stepPreset === preset.id
                                ? 'bg-robin-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-dark-lighter'
                        }`}
                        data-step-value={preset.value}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* D-pad + Z axis row */}
            <div className="flex items-center gap-4">
                {/* D-pad */}
                <div className="relative w-36 h-36 shrink-0">
                    <div className="absolute inset-0 rounded-full border border-gray-200 dark:border-dark-lighter bg-gray-50 dark:bg-dark" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight select-none">XY<br />JOG</span>
                    </div>
                    <button className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-lighter rounded-full">
                        <ChevronUp size={20} />
                    </button>
                    <button className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-lighter rounded-full">
                        <ChevronDown size={20} />
                    </button>
                    <button className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-lighter rounded-full">
                        <ChevronLeft size={20} />
                    </button>
                    <button className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-lighter rounded-full">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Z-axis buttons */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Z AXIS</span>
                    <button className="w-full h-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-lighter text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter hover:text-gray-900 dark:hover:text-white flex items-center justify-center">
                        <Plus size={20} />
                    </button>
                    <div className="w-full h-10 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-lighter text-gray-400 dark:text-gray-500 flex items-center justify-center text-sm font-semibold">
                        Z
                    </div>
                    <button className="w-full h-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-lighter text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter hover:text-gray-900 dark:hover:text-white flex items-center justify-center">
                        <Minus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
