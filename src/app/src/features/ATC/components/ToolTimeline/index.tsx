import { ToolTimeline } from 'app/features/ATC/components/ToolTimeline/components/ToolTimeline.tsx';
import { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { useEffect, useState } from 'react';
import pubsub from 'pubsub-js';
import { RootState } from 'app/store/redux';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import get from 'lodash/get';
import controller from 'app/lib/controller.ts';
import { getToolpathColor } from 'app/features/ATC/utils/ATCFunctions.ts';

function buildToolArray(toolEvents, fileLength) {
    let count = 0;
    const toolArray: ToolChange[] = [];

    Object.entries(toolEvents).forEach(([line, value]) => {
        if (Object.hasOwn(value, 'M') && Object.hasOwn(value, 'T')) {
            let newTool: ToolChange = {};
            newTool.toolNumber = value.T;
            newTool.startLine = Number(line);
            newTool.label = `T${value.T}`;
            const legendColor = getToolpathColor(count);
            newTool.color = `#${legendColor.getHexString()}`;
            newTool.index = count + 1;
            toolArray.push(newTool);

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
