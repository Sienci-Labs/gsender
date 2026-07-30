import { useEffect } from 'react';

import Visualizer from 'app/features/Visualizer';
import { useDispatch } from 'react-redux';
import { setCurrentVisualizer } from 'app/store/redux/slices/visualizer.slice';
import {
    SURFACING_VISUALIZER_CONTAINER_ID,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';

type VisualizerPreviewProps = {
    gcode: string;
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
                    No g-code generated yet. <br /> Please generate g-code
                    first.
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full items-center justify-center"
            id={SURFACING_VISUALIZER_CONTAINER_ID}
        >
            <Visualizer isSecondary />
        </div>
    );
};

export default VisualizerPreview;
