import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import Visualizer from './Visualizer';
import JobControls from './JobControls';
import FeedOverrideWrapper from './FeedOverrideWrapper';

export default function VisualizerCard() {
    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer canvas */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-lighter overflow-hidden flex flex-col">
                <div className="relative h-56">
                    <Visualizer />
                    {/* View label pills */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        <span className="text-xs bg-white/70 dark:bg-dark-lighter/70 text-gray-700 dark:text-gray-300 rounded px-2 py-0.5 backdrop-blur-sm">View: ISO</span>
                        <span className="text-xs bg-white/70 dark:bg-dark-lighter/70 text-gray-700 dark:text-gray-300 rounded px-2 py-0.5 backdrop-blur-sm">Zoom: 1.0x</span>
                    </div>
                </div>

                {/* Legend + zoom row */}
                <div className="flex items-center px-3 py-2 bg-white dark:bg-dark-darker border-t border-gray-200 dark:border-dark-lighter">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Cut</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Rapid</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Bounds</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {[ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
                            <button key={i} className="p-2 rounded border border-gray-200 dark:border-dark-lighter text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white bg-white dark:bg-dark hover:bg-gray-50 dark:hover:bg-dark-lighter">
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Job controls */}
            <JobControls />

            {/* Progress */}
            <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-400">
                    <span>Progress</span>
                    <span>Line 0 / 0 · 0%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-lighter rounded-full overflow-hidden">
                    <div className="h-full bg-robin-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>

            {/* Override sliders */}
            <FeedOverrideWrapper />
        </div>
    );
}
