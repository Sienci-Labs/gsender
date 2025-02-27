import { useRef } from 'react';

import WoodBlockBefore from './assets/loading-wood-block.gif';
import SpinningDrill from './assets/loading-spinning-bit-test2.gif';
import WoodBlockAfter from './assets/loading-wood-dust-pile.gif';

type WoodcuttingProgressProps = {
    percentage: number;
};

const WoodcuttingProgress = ({ percentage }: WoodcuttingProgressProps) => {
    const drillImageRef = useRef<HTMLImageElement>(null);

    return (
        <div className="relative w-full h-12">
            {/* Wood pieces and dust that is shown as drill progresses */}
            <div
                className={`absolute inset-0 w-full bg-contain bg-bottom bg-repeat-x mt-auto`}
                style={{
                    backgroundImage: `url(${WoodBlockAfter})`,
                }}
            />

            {/* Wood block that gets hidden as drill progresses */}
            <div
                className="absolute z-10 inset-0 w-full bg-cover bg-center mt-auto h-8 "
                style={{
                    backgroundImage: `url(${WoodBlockBefore})`,
                    clipPath: `polygon(${Math.min(100, Math.max(0, percentage))}% 0%, 100% 0%, 100% 100%, ${Math.min(100, Math.max(0, percentage))}% 100%)`,
                    transition: 'clip-path 0.2s ease-out',
                }}
            />

            {/* Drill that moves across */}
            <img
                src={SpinningDrill}
                alt="Spinning Drill"
                className="absolute top-1/2 w-8 h-auto transition-all duration-100 -translate-y-1/2 z-10"
                style={{
                    left: `calc(${percentage}% - ${drillImageRef.current?.offsetWidth}px + 6px)`,
                    animationPlayState: 'paused',
                }}
                ref={drillImageRef}
            />
        </div>
    );
};

export default WoodcuttingProgress;
