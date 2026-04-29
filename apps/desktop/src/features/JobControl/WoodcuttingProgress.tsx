import { useRef } from 'react';

import SpinningDrill from './assets/loading-spinning-bit.gif';
import SpinningDrillPaused from './assets/loading-spinning-bit-paused.gif';
import WoodBlockBefore from './assets/loading-wood-block-lines.png';
import WoodBlockAfter from './assets/loading-wood-dust-pile.gif';

type WoodcuttingProgressProps = {
    percentage: number;
    isPaused?: boolean;
};

const WoodcuttingProgress = ({
    percentage,
    isPaused = false,
}: WoodcuttingProgressProps) => {
    const drillImageRef = useRef<HTMLImageElement>(null);

    // Use static SVG when paused, animated GIF when running
    const currentDrillSrc = isPaused ? SpinningDrillPaused : SpinningDrill;

    return (
        <div className="relative w-full h-12">
            {/* Wood pieces and dust that is shown as drill progresses */}
            <div
                className={`absolute inset-0 w-full bg-contain bg-bottom bg-repeat-x mt-auto brightness-[0.8]`}
                style={{
                    backgroundImage: `url(${WoodBlockAfter})`,
                }}
            />

            {/* Wood block that gets hidden as drill progresses */}
            <div
                className="absolute z-10 inset-0 w-full bg-cover bg-center mt-auto h-8 brightness-[0.8]"
                style={{
                    backgroundImage: `url(${WoodBlockBefore})`,
                    clipPath: `polygon(${Math.min(100, Math.max(0, percentage))}% 0%, 100% 0%, 100% 100%, ${Math.min(100, Math.max(0, percentage))}% 100%)`,
                    transition: 'clip-path 0.2s ease-out',
                }}
            />

            <img
                src={currentDrillSrc}
                alt="Spinning Drill"
                className="absolute top-1/2 w-8 h-auto transition-all duration-100 -translate-y-1/2 z-10 brightness-[0.8]"
                style={{
                    left: `calc(${percentage}% - ${drillImageRef.current?.offsetWidth}px + 6px)`,
                    // opacity: isPaused ? 0.7 : 1,
                    transition: 'opacity 0.3s ease',
                }}
                ref={drillImageRef}
            />
        </div>
    );
};

export default WoodcuttingProgress;
