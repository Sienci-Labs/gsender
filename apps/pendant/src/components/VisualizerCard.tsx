import Visualizer from './Visualizer';
import JobControls from './JobControls';
import FeedOverrideWrapper from './FeedOverrideWrapper';
import WorkspaceSelector from './WorkspaceSelector';
import ProgressAreaWrapper from './ProgressAreaWrapper';

export default function VisualizerCard() {
    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer canvas */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-lighter overflow-hidden flex flex-col">
                {/* Top toolbar */}
                <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-dark-darker border-b border-gray-200 dark:border-dark-lighter">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3e85c7' }} />Cut</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#0ef6ae' }} />Rapid</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Bounds</span>
                    </div>
                    <WorkspaceSelector />
                </div>

                <div className="relative h-56">
                    <Visualizer />
                </div>
            </div>

            {/* Job controls */}
            <JobControls />

            <ProgressAreaWrapper />

            {/* Override sliders */}
            <FeedOverrideWrapper />
        </div>
    );
}
