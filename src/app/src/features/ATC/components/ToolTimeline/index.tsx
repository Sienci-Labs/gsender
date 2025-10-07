import { ToolTimeline } from 'app/features/ATC/components/ToolTimeline/components/ToolTimeline.tsx';
import { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { useEffect, useState } from 'react';
import pubsub from 'pubsub-js';

function buildToolArray(toolEvents, fileLength) {
    let start = 1;
    let count = 1;
    const toolArray = [];

    Object.entries(toolEvents).forEach(([line, value]) => {
        if (Object.hasOwn(value, 'M') && Object.hasOwn(value, 'T')) {
            let newTool = {};
            newTool.toolNumber = value.T;
            newTool.startLine = line;
            newTool.label = `T${value.T}`;
            toolArray.push(newTool);
        }
    });

    if (toolArray.length === 1) {
        toolArray[0].endLine = fileLength;
    } else {
        toolArray[toolArray.length - 1].endLine = fileLength;
        for (let i = toolArray.length - 2; i >= 0; i--) {
            toolArray[i].endLine = toolArray[i + 1].startLine - 1;
        }
    }

    console.log(toolArray);
    return toolArray;
}

export function ToolTimelineWrapper() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeToolIndex, setActiveToolIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [show, setShow] = useState(true);
    const [tools, setTools] = useState<ToolChange[]>([]);

    useEffect(() => {
        pubsub.subscribe('file:toolchanges', (k, { toolEvents, total }) => {
            const toolArray = buildToolArray(toolEvents, total);
            console.log(total);
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

        return () => {
            setShow(false);
            pubsub.unsubscribe('file:toolchanges');
        };
    }, []);

    const sampleTools: ToolChange[] = [
        {
            id: '1',
            toolNumber: 1,
            color: '#3b82f6',
            label: 'End Mill 6mm',
            startLine: 1,
            endLine: 450,
        },
        {
            id: '2',
            toolNumber: 2,
            color: '#ef4444',
            label: 'Ball Nose 3mm',
            startLine: 451,
            endLine: 890,
        },
        {
            id: '3',
            toolNumber: 3,
            color: '#10b981',
            label: 'V-Bit 90°',
            startLine: 891,
            endLine: 1200,
        },
    ];

    if (!show) {
        return <div></div>;
    }

    return (
        <div className="absolute top-4 left-4 z-50">
            <ToolTimeline
                tools={sampleTools}
                activeToolIndex={activeToolIndex}
                progress={progress}
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />
        </div>
    );
}
