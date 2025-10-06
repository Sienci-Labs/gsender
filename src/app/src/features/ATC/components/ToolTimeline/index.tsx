import { ToolTimeline } from 'app/features/ATC/components/ToolTimeline/components/ToolTimeline.tsx';
import { ToolChange } from 'app/features/ATC/components/ToolTimeline/components/types.ts';
import { useState } from 'react';

export function ToolTimelineWrapper() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeToolIndex, setActiveToolIndex] = useState(0);
    const [progress, setProgress] = useState(0);

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

    return (
        <div className="absolute top-2 left-2">
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
