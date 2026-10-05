import type { GCodeSVGRendererHandle } from '@sienci/gviewer/react';
import { GCodeSVGVisualizer } from '@sienci/gviewer/react';
import { WORKFLOW_STATE_RUNNING } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import pubsub from 'pubsub-js';
import { memo, useEffect, useRef } from 'react';
import {
    PENDANT_BOUNDS_COLOR,
    PENDANT_CUT_COLOR,
    PENDANT_RAPID_COLOR,
} from '../visualizerTheme';

// Module-level so the renderer sees the same options object on every render.
const SVG_OPTIONS = {
    cutColor: PENDANT_CUT_COLOR,
    rapidColor: PENDANT_RAPID_COLOR,
    boundingBoxColor: PENDANT_BOUNDS_COLOR,
    strokeWidth: 1,
    projectionMode: 'top',
    padding: 8,
} as const;

function Visualizer() {
    const svgRef = useRef<GCodeSVGRendererHandle>(null);
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const workflowState = useTypedSelector(
        (s: RootState) => s.controller.workflow.state,
    );
    // Status reports replace wpos several times a second even when idle; only
    // a running job moves the bit marker, so don't re-render otherwise.
    const wpos = useTypedSelector((s: RootState) =>
        s.controller.workflow.state === WORKFLOW_STATE_RUNNING
            ? s.controller.wpos
            : null,
    );

    useEffect(() => {
        const tokens = [
            pubsub.subscribe('file:load', (_msg, data) => {
                if (data.svgSegmentGroups?.length) {
                    svgRef.current?.loadFromPrecomputedGroups(
                        data.svgSegmentGroups,
                        data.svgMeta,
                    );
                } else if (data.format === 'segments-v1') {
                    svgRef.current?.loadFromSegments(data);
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
        if (!wpos) return;
        svgRef.current?.setBitPosition({
            x: Number(wpos.x),
            y: Number(wpos.y),
            z: Number(wpos.z),
        });
    }, [wpos]);

    return (
        <GCodeSVGVisualizer
            ref={svgRef}
            id="pendant-svg-vis"
            options={SVG_OPTIONS}
            className="w-full h-full"
        />
    );
}

export default memo(Visualizer);
