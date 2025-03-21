import { useTypedSelector } from 'app/hooks/useTypedSelector';

const Info = () => {
    const { toolSet, movementSet, spindleSet, estimatedTime } =
        useTypedSelector((state) => state.file);

    const toolSetFormatted = toolSet.map((tool) => tool.replace('T', ''));
    const movementSetFormatted = movementSet
        .map((spindle) => Number(spindle.replace('F', '')))
        .sort();
    const spindleSetFormatted = spindleSet.map((spindle) =>
        Number(spindle.replace('S', '')),
    );

    const feedrateMin = Math.min(...movementSetFormatted);
    const feedrateMax = Math.max(...movementSetFormatted);
    const spindleMin = Math.min(...spindleSetFormatted);
    const spindleMax = Math.max(...spindleSetFormatted);

    const formatEstimatedTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${Math.ceil(seconds)}s`;
        }

        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${Math.ceil(remainingSeconds)}s`;
        }

        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    const formattedEstimatedTime = formatEstimatedTime(estimatedTime);

    return (
        <div className="text-gray-900 dark:text-gray-300">
            <div className="flex gap-1">
                <span className="font-bold">Estimated Time</span>
                <span>{formattedEstimatedTime}</span>
            </div>

            <div className="flex gap-1">
                <span className="font-bold">Feed</span>
                <span>
                    {feedrateMin}-{feedrateMax} mm/min
                </span>
            </div>

            <div className="flex gap-1">
                <span className="font-bold">Speed</span>
                <span>
                    {spindleSetFormatted.length === 0
                        ? 'None'
                        : `${spindleMin}-${spindleMax} RPM`}
                </span>
            </div>

            <div className="flex gap-1">
                <span className="font-bold">Tools</span>
                <span>
                    {toolSetFormatted.length === 0
                        ? 'None'
                        : `${toolSetFormatted.length} (${toolSetFormatted.toString()})`}
                </span>
            </div>
        </div>
    );
};

export default Info;
