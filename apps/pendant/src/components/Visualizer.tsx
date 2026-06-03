import { useRef, useEffect } from 'react';
import pubsub from 'pubsub-js';
import { GCodeSVGVisualizer } from '@sienci/gviewer/react';
import type { GCodeSVGRendererHandle } from '@sienci/gviewer/react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import {
    PENDANT_BOUNDS_COLOR,
    PENDANT_CUT_COLOR,
    PENDANT_RAPID_COLOR,
} from '../visualizerTheme';

export default function Visualizer() {
    const svgRef = useRef<GCodeSVGRendererHandle>(null);
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('file:load', (_msg, data) => {
                svgRef.current?.loadFromWorkerData(data);
            }),
        ];

        return () => {
            tokens.forEach((token) => pubsub.unsubscribe(token));
        };
    }, []);

    useEffect(() => {
        if (!fileLoaded) {
            svgRef.current?.clear();
        }
    }, [fileLoaded]);

    return (
        <GCodeSVGVisualizer
            ref={svgRef}
            id="pendant-svg-vis"
            options={{
                cutColor: PENDANT_CUT_COLOR,
                rapidColor: PENDANT_RAPID_COLOR,
                boundingBoxColor: PENDANT_BOUNDS_COLOR,
                strokeWidth: 1,
                projectionMode: 'isometric',
                padding: 8,
            }}
            className="w-full h-full"
        />
    );
}
