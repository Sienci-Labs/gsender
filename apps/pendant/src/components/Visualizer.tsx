import { useRef, useEffect } from 'react';
import { GCodeSVGVisualizer } from '@sienci/gviewer/react';
import type { GCodeSVGRendererHandle } from '@sienci/gviewer/react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

export default function Visualizer() {
    const svgRef = useRef<GCodeSVGRendererHandle>(null);
    const content = useTypedSelector((s: RootState) => s.fileInfo.content);

    useEffect(() => {
        if (!svgRef.current) return;
        if (content) {
            svgRef.current.loadFromText(content);
        } else {
            svgRef.current.clear();
        }
    }, [content]);

    return (
        <GCodeSVGVisualizer
            ref={svgRef}
            id="pendant-svg-vis"
            options={{
                cutColor: '#3b82f6',
                rapidColor: '#f97316',
                boundingBoxColor: '#9ca3af',
                strokeWidth: 1,
                projectionMode: 'isometric',
                padding: 8,
            }}
            className="w-full h-full"
        />
    );
}
