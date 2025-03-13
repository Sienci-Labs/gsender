import Visualizer from 'app/features/Visualizer';

type VisualizerPreviewProps = {
    gcode: string;
};

const VisualizerPreview = ({ gcode }: VisualizerPreviewProps) => {
    if (!gcode) {
        return (
            <div className="flex flex-col h-full items-center justify-center border border-gray-200 rounded-md p-4">
                <p className="text-gray-500 text-center text-sm">
                    No G-code generated yet. <br /> Please generate G-code
                    first.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full items-center justify-center border border-gray-200 rounded-md">
            <Visualizer gcode={gcode} />
        </div>
    );
};

export default VisualizerPreview;
