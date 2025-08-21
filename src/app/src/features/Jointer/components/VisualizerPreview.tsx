import {
    JOINTER_VISUALIZER_CONTAINER_ID,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import Visualizer from 'app/features/Visualizer';
import { setCurrentVisualizer } from 'app/store/redux/slices/visualizer.slice';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

type VisualizerPreviewProps = {
    gcode?: string;
};

const VisualizerPreview = ({ gcode }: VisualizerPreviewProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setCurrentVisualizer(VISUALIZER_SECONDARY));
        return () => {
            dispatch(setCurrentVisualizer(VISUALIZER_PRIMARY));
        };
    }, []);

    if (!gcode) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <p className="text-gray-500 text-center text-sm">
                    No G-code generated yet. <br /> Please generate G-code
                    first.
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full items-center justify-center border border-gray-200 rounded-md dark:border-dark-lighter"
            id={JOINTER_VISUALIZER_CONTAINER_ID}
        >
            <Visualizer isSecondary />
        </div>
    );
};

export default VisualizerPreview;