import VisualizerCard from './VisualizerCard';
import DROCard from './DROCard';
import JoggingCard from './JoggingCard';
import BottomDrawer from './BottomDrawer';

export default function CarveView() {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* 2-col main grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden">
                {/* Left col: visualizer + job controls */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                    <VisualizerCard />
                </div>

                {/* Right col: DRO + jogging */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                    <DROCard />
                    <JoggingCard />
                </div>
            </div>

            {/* Expandable bottom drawer */}
            <BottomDrawer />
        </div>
    );
}
