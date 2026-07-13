import { useRef, useEffect } from 'react';
import pubsub from 'pubsub-js';
import { GCodeSVGVisualizer } from '@sienci/gviewer/react';
import type { GCodeSVGRendererHandle } from '@sienci/gviewer/react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { WORKFLOW_STATE_RUNNING } from 'app/constants';
import {
    PENDANT_BOUNDS_COLOR,
    PENDANT_CUT_COLOR,
    PENDANT_RAPID_COLOR,
} from '../visualizerTheme';

export default function Visualizer() {
    const svgRef = useRef<GCodeSVGRendererHandle>(null);
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const workflowState = useTypedSelector((s: RootState) => s.controller.workflow.state);
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('file:load', (_msg, data) => {
                if (data.svgSegmentGroups?.length) {
                    svgRef.current?.loadFromPrecomputedGroups(
                        data.svgSegmentGroups,
                        data.svgMeta,
                    );
                } else {
                    svgRef.current?.loadFromWorkerData(data);
                }
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

    useEffect(() => {
        svgRef.current?.setBitVisible(workflowState === WORKFLOW_STATE_RUNNING);
    }, [workflowState]);

    useEffect(() => {
        if (workflowState !== WORKFLOW_STATE_RUNNING) return;
        svgRef.current?.setBitPosition({
            x: Number(wpos.x),
            y: Number(wpos.y),
            z: Number(wpos.z),
        });
    }, [wpos, workflowState]);

    return (
        <GCodeSVGVisualizer
            ref={svgRef}
            id="pendant-svg-vis"
            options={{
                cutColor: PENDANT_CUT_COLOR,
                rapidColor: PENDANT_RAPID_COLOR,
                boundingBoxColor: PENDANT_BOUNDS_COLOR,
                strokeWidth: 1,
                projectionMode: 'top',
                padding: 8,
            }}
            className="w-full h-full"
        />
    );
}
