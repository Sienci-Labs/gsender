import { useEffect, useState } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import WoodcuttingProgress from 'app/features/JobControl/WoodcuttingProgress.tsx';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime.ts';

export function SDCardProgress() {
    const [progress, setProgress] = useState({ name: null, percentage: 0 });

    const sdCardProgress = useTypedSelector(
        (state: RootState) => state.controller.state.status?.SD,
    );

    useEffect(() => {
        console.log(sdCardProgress);
        if (sdCardProgress) {
            setProgress(sdCardProgress);
        } else {
            setProgress({ name: null, percentage: 0 });
        }
    }, [sdCardProgress]);

    console.log(progress);

    if (!progress.name) {
        return <></>;
    }

    let translationNumber = '55px';
    if (progress.percentage > 35 && progress.percentage <= 50) {
        translationNumber = (progress.percentage || 0) + '%';
    } else if (progress.percentage > 50 && progress.percentage < 75) {
        translationNumber = progress.percentage - 40 + '%';
    }

    return (
        <div className="z-10 absolute bottom-[35%] portrait:bottom-[calc(50%+85px)] left-1/2 right-1/2 -translate-x-1/2 w-64 justify-center items-center flex">
            <div className="w-64">
                <div className="border-solid border border-gray-500 dark:border-gray-700 rounded-sm bg-gray-100 dark:bg-dark gap-2 flex flex-row justify-between items-center pr-1 pt-1 text-gray-900 dark:text-gray-200">
                    <div className="flex flex-col gap-0 w-full h-full -mt-6">
                        <div
                            className="flex flex-row justify-start items-end px-3 -mb-1 whitespace-nowrap transition-transform duration-200"
                            style={{
                                transform: `translate(${translationNumber}, 16px)`,
                            }}
                        >
                            <span className="font-bold text-2xl">
                                {Math.floor(progress.percentage)}
                            </span>
                            <span>%</span>
                        </div>
                        <WoodcuttingProgress
                            percentage={progress.percentage}
                            isPaused={false}
                        />
                    </div>
                    <div className="w-full flex flex-row gap-2 text-gray-400 text-sm whitespace-nowrap items-center justify-center">
                        <span>{`${progress.name}`}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
