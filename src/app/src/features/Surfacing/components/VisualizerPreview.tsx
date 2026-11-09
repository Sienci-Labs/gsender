import {
    SURFACING_VISUALIZER_CONTAINER_ID,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import Visualizer from 'app/features/Visualizer';
import { setCurrentVisualizer } from 'app/store/redux/slices/visualizer.slice';
import { useEffect, type ComponentType } from 'react';
import { useDispatch } from 'react-redux';

type VisualizerPreviewProps = {
    gcode?: string;
    /** Pendant override: renders gcode with the pendant's own viewer instead
     * of the desktop secondary-visualizer plumbing below, which the pendant
     * shell has no equivalent of. */
    PreviewComponent?: ComponentType<{ gcode?: string }>;
};

const VisualizerPreview = ({ gcode, PreviewComponent }: VisualizerPreviewProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (PreviewComponent) return;
        dispatch(setCurrentVisualizer(VISUALIZER_SECONDARY));
        return () => {
            dispatch(setCurrentVisualizer(VISUALIZER_PRIMARY));
        };
    }, [PreviewComponent]);

    if (PreviewComponent) {
        return (
            <div
                className="flex flex-col h-full min-h-[320px] items-center justify-center border border-gray-200 rounded-md dark:border-outline"
                id={SURFACING_VISUALIZER_CONTAINER_ID}
            >
                <PreviewComponent gcode={gcode} />
            </div>
        );
    }

    if (!gcode) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <p className="text-gray-600 text-center text-sm">
                    No g-code generated yet. <br /> Please generate g-code
                    first.
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full items-center justify-center border border-gray-200 rounded-md dark:border-outline"
            id={SURFACING_VISUALIZER_CONTAINER_ID}
        >
            <Visualizer isSecondary />
        </div>
    );
};

export default VisualizerPreview;
