/*
 * Toolpath Visualizer Component for Height Map
 * Shows a 3D representation of the modified G-code toolpath
 */

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
    SURFACING_VISUALIZER_CONTAINER_ID,
} from 'app/constants';
import Visualizer from 'app/features/Visualizer';
import { setCurrentVisualizer } from 'app/store/redux/slices/visualizer.slice';

interface ToolpathVisualizerProps {
    gcode?: string | null;
}

const ToolpathVisualizer: React.FC<ToolpathVisualizerProps> = ({ gcode }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setCurrentVisualizer(VISUALIZER_SECONDARY));
        return () => {
            dispatch(setCurrentVisualizer(VISUALIZER_PRIMARY));
        };
    }, [dispatch]);

    if (!gcode) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md">
                <div className="text-center p-4">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No modified G-code yet.
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Click "Generate G-code" to apply the height map<br />
                        and preview the modified toolpath here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full items-center justify-center border border-gray-200 rounded-md dark:border-gray-600 overflow-hidden"
            id={SURFACING_VISUALIZER_CONTAINER_ID}
        >
            <Visualizer isSecondary />
        </div>
    );
};

export default ToolpathVisualizer;
