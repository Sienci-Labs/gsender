import { ToolTimeline } from 'app/features/ATC/components/ToolTimeline/components/ToolTimeline.tsx';
import { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { useEffect, useState } from 'react';
import * as Three from 'three';
import pubsub from 'pubsub-js';
import {
    DARK_THEME_VALUES,
    G1_PART,
    LIGHT_THEME_VALUES,
} from 'app/features/Visualizer/constants';
import store from 'app/store';
import { generateComplementaryColor } from 'app/workers/colors.worker';
import { RootState } from 'app/store/redux';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import get from 'lodash/get';
import controller from 'app/lib/controller.ts';
import { mapToolNicknamesAndStatus } from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';

function getThemeCuttingColour() {
    const visualizerTheme = store.get('widgets.visualizer.theme', 'Dark');
    if (visualizerTheme === 'Dark') {
        return DARK_THEME_VALUES.get(G1_PART);
    } else {
        return LIGHT_THEME_VALUES.get(G1_PART);
    }
}

function buildToolArray(toolEvents, fileLength) {
    let count = 0;
    const toolArray: ToolChange[] = [];
    let originalColor = getThemeCuttingColour();
    let legendColor = new Three.Color(originalColor);

    Object.entries(toolEvents).forEach(([line, value]) => {
        if (Object.hasOwn(value, 'M') && Object.hasOwn(value, 'T')) {
            let newTool: ToolChange = {};
            newTool.toolNumber = value.T;
            newTool.startLine = Number(line);
            newTool.label = `T${value.T}`;
            newTool.color = `#${legendColor.getHexString()}`;
            newTool.index = count + 1;
            toolArray.push(newTool);

            // Prime next colour in sequence
            legendColor = generateComplementaryColor(legendColor, count);
            count++;
        }
    });

    if (toolArray.length === 0) {
        return [];
    } else if (toolArray.length === 1) {
        toolArray[0].endLine = fileLength;
    } else {
        toolArray[toolArray.length - 1].endLine = fileLength;
        for (let i = toolArray.length - 2; i >= 0; i--) {
            toolArray[i].endLine = toolArray[i + 1].startLine - 1;
        }
    }

    return toolArray;
}

export function ToolTimelineWrapper() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeToolIndex, setActiveToolIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [show, setShow] = useState(false);
    const [tools, setTools] = useState<ToolChange[]>([]);

    const fileLoaded = useTypedSelector(
        (state: RootState) => state.file.fileLoaded,
    );

    const linesReceived = useTypedSelector((state: RootState) => {
        return get(state, 'controller.sender.status.received', 0);
    });

    useEffect(() => {
        if (tools.length === 0) {
            return;
        }
        if (linesReceived > tools[activeToolIndex].endLine) {
            setActiveToolIndex(activeToolIndex + 1);
        }
    }, [linesReceived]);

    useEffect(() => {
        pubsub.subscribe('file:toolchanges', (k, { toolEvents, total }) => {
            const toolArray = buildToolArray(toolEvents, total);

            if (toolArray.length === 0) {
                setShow(false);
                setTools([]);
                return;
            }
            setTools(toolArray);
            setActiveToolIndex(0);
            setProgress(0);
            setShow(true);
        });

        controller.addListener('job:stop', () => {
            setActiveToolIndex(0);
        });

        return () => {
            setShow(false);
            pubsub.unsubscribe('file:toolchanges');
        };
    }, []);

    useEffect(() => {
        if (!fileLoaded) {
            setShow(false);
            setTools([]);
            setActiveToolIndex(0);
        }
    }, [fileLoaded]);

    if (!show) {
        return <div></div>;
    }

    return (
        <div className="absolute top-4 left-4 z-10">
            <ToolTimeline
                tools={tools}
                activeToolIndex={activeToolIndex}
                progress={progress}
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />
        </div>
    );
}
