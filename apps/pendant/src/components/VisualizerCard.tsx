import Visualizer from './Visualizer';
import JobControls from './JobControls';
import FeedOverrideWrapper from './FeedOverrideWrapper';
import WorkspaceSelector from './WorkspaceSelector';

export default function VisualizerCard() {
    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer canvas */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-lighter overflow-hidden flex flex-col">
                {/* Top toolbar */}
                <div className="flex items-center px-3 py-2 bg-white dark:bg-dark-darker border-b border-gray-200 dark:border-dark-lighter">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Cut</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Rapid</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Bounds</span>
                    </div>
                    <WorkspaceSelector />
                </div>

                <div className="relative h-56">
                    <Visualizer />
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
