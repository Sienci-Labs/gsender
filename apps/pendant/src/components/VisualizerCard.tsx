import { ZoomIn, ZoomOut, Maximize2, Play, Pause, Square } from 'lucide-react';

export default function VisualizerCard() {
    return (
        <div className="flex flex-col gap-3 min-h-0">
            {/* Visualizer canvas placeholder */}
            <div className="rounded-xl border border-dark-lighter overflow-hidden flex flex-col" style={{ minHeight: 0, flex: '1 1 0' }}>
                {/* Canvas area */}
                <div className="relative bg-[#0a1628] flex-1 min-h-0">
                    {/* View label pills */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        <span className="text-xs bg-dark-lighter/70 text-gray-300 rounded px-2 py-0.5 backdrop-blur-sm">View: ISO</span>
                        <span className="text-xs bg-dark-lighter/70 text-gray-300 rounded px-2 py-0.5 backdrop-blur-sm">Zoom: 1.0x</span>
                    </div>
                    {/* Placeholder grid */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-3/4 h-1/2 border-2 border-dashed border-gray-500 rounded" />
                    </div>
                </div>

                {/* Legend + zoom row */}
                <div className="flex items-center px-3 py-2 bg-dark-darker border-t border-dark-lighter">
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Cut</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Rapid</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Bounds</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {[ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
                            <button key={i} className="p-2 rounded border border-dark-lighter text-gray-400 hover:text-white bg-dark hover:bg-dark-lighter">
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress</span>
                    <span>Line 0 / 0 · 0%</span>
                </div>
                <div className="w-full h-1.5 bg-dark-lighter rounded-full overflow-hidden">
                    <div className="h-full bg-robin-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>

            {/* Job controls */}
            <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-2 h-14 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm">
                    <Play size={16} fill="currentColor" /> START
                </button>
                <button className="flex items-center justify-center gap-2 h-14 rounded-xl border border-dark-lighter text-gray-300 hover:bg-dark-lighter font-semibold text-sm">
                    <Pause size={16} /> PAUSE
                </button>
                <button className="flex items-center justify-center gap-2 h-14 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/30 font-semibold text-sm">
                    <Square size={14} fill="currentColor" /> STOP
                </button>
            </div>

            {/* Override sliders */}
            <div className="flex flex-col gap-3 px-1">
                {['FEED OVERRIDE', 'SPINDLE OVERRIDE'].map((label) => (
                    <div key={label} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-500 uppercase tracking-wide">
                            <span>{label}</span>
                            <span className="text-white font-semibold">100%</span>
                        </div>
                        <div className="relative h-2 bg-dark-lighter rounded-full">
                            <div className="absolute h-full bg-robin-500 rounded-full" style={{ width: '100%' }} />
                            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-robin-400 border-2 border-white shadow" style={{ left: 'calc(100% - 8px)' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
