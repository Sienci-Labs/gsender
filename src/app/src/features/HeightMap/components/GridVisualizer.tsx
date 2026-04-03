/*
 * Grid Visualizer Component for Height Map
 * Shows a 2D representation of the probe grid and height map data
 */

import React, { useMemo, useRef, useState } from 'react';
import { HeightMapData } from '../definitions';

interface GridVisualizerProps {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    gridSpacing: number;
    usePointCount: boolean;
    pointCountX: number;
    pointCountY: number;
    mapData: HeightMapData | null;
    currentProbeIndex: number;
    isProbing: boolean;
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    content: string;
}

const GridVisualizer: React.FC<GridVisualizerProps> = ({
    minX,
    maxX,
    minY,
    maxY,
    gridSpacing,
    usePointCount,
    pointCountX,
    pointCountY,
    mapData,
    currentProbeIndex,
    isProbing,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' });

    // Calculate grid points - use map data points if available, otherwise generate from config
    const gridPoints = useMemo(() => {
        // If we have map data with points, use those directly for visualization
        if (mapData?.points && mapData.points.length > 0) {
            return mapData.points.map(p => ({ x: p.x, y: p.y }));
        }

        // Otherwise generate grid points from config
        const points: { x: number; y: number }[] = [];

        let xPoints: number[];
        let yPoints: number[];

        if (usePointCount) {
            const xStep = pointCountX > 1 ? (maxX - minX) / (pointCountX - 1) : 0;
            const yStep = pointCountY > 1 ? (maxY - minY) / (pointCountY - 1) : 0;

            xPoints = Array.from({ length: pointCountX }, (_, i) =>
                Number((minX + i * xStep).toFixed(3)),
            );
            yPoints = Array.from({ length: pointCountY }, (_, i) =>
                Number((minY + i * yStep).toFixed(3)),
            );
        } else {
            const xCount = Math.ceil((maxX - minX) / gridSpacing) + 1;
            const yCount = Math.ceil((maxY - minY) / gridSpacing) + 1;

            xPoints = Array.from({ length: xCount }, (_, i) =>
                Number(Math.min(minX + i * gridSpacing, maxX).toFixed(3)),
            );
            yPoints = Array.from({ length: yCount }, (_, i) =>
                Number(Math.min(minY + i * gridSpacing, maxY).toFixed(3)),
            );

            if (xPoints[xPoints.length - 1] !== maxX) {
                xPoints.push(maxX);
            }
            if (yPoints[yPoints.length - 1] !== maxY) {
                yPoints.push(maxY);
            }
        }

        // Generate grid points in zigzag pattern
        for (let yi = 0; yi < yPoints.length; yi++) {
            const y = yPoints[yi];
            const xOrder = yi % 2 === 0 ? xPoints : [...xPoints].reverse();

            for (const x of xOrder) {
                points.push({ x, y });
            }
        }

        return points;
    }, [minX, maxX, minY, maxY, gridSpacing, usePointCount, pointCountX, pointCountY, mapData]);

    // Calculate Z range for color mapping
    const { minZ, maxZ } = useMemo(() => {
        if (!mapData?.points || mapData.points.length === 0) {
            return { minZ: 0, maxZ: 0 };
        }
        const zValues = mapData.points.map((p) => p.z);
        return {
            minZ: Math.min(...zValues),
            maxZ: Math.max(...zValues),
        };
    }, [mapData]);

    // Get color for a Z value
    const getZColor = (z: number): string => {
        if (maxZ === minZ) {
            return 'rgb(100, 200, 100)'; // Green for flat surface
        }
        const normalized = (z - minZ) / (maxZ - minZ);
        // Color gradient from blue (low) to red (high)
        const r = Math.round(normalized * 255);
        const b = Math.round((1 - normalized) * 255);
        const g = Math.round((1 - Math.abs(normalized - 0.5) * 2) * 200);
        return `rgb(${r}, ${g}, ${b})`;
    };

    // Find Z value for a point from map data by index
    const getPointZ = (index: number): number | null => {
        if (!mapData?.points || index >= mapData.points.length) return null;
        return mapData.points[index]?.z ?? null;
    };

    // Fixed SVG dimensions
    const svgWidth = 320;
    const svgHeight = 240;
    const padding = 30;

    // Use map bounds if available, otherwise use config bounds
    const displayMinX = mapData?.bounds?.minX ?? minX;
    const displayMaxX = mapData?.bounds?.maxX ?? maxX;
    const displayMinY = mapData?.bounds?.minY ?? minY;
    const displayMaxY = mapData?.bounds?.maxY ?? maxY;

    // Calculate scale
    const xRange = displayMaxX - displayMinX || 1;
    const yRange = displayMaxY - displayMinY || 1;
    const scale = Math.min(
        (svgWidth - 2 * padding) / xRange,
        (svgHeight - 2 * padding) / yRange,
    );

    // Transform coordinates to SVG space
    const toSvgX = (x: number) => padding + (x - displayMinX) * scale;
    const toSvgY = (y: number) => svgHeight - padding - (y - displayMinY) * scale;

    // Handle mouse enter on point
    const handlePointMouseEnter = (
        event: React.MouseEvent,
        point: { x: number; y: number },
        index: number,
    ) => {
        const z = getPointZ(index);
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
            const content = z !== null
                ? `X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}, Z: ${z.toFixed(3)}`
                : `X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}`;

            setTooltip({
                visible: true,
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 8,
                content,
            });
        }
    };

    const handlePointMouseLeave = () => {
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
    };

    return (
        <div ref={containerRef} className="flex flex-col items-center relative">
            {/* Tooltip */}
            {tooltip.visible && (
                <div
                    className="absolute z-10 px-2 py-1 text-xs bg-gray-800 text-white rounded shadow-lg pointer-events-none whitespace-nowrap"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    {tooltip.content}
                </div>
            )}

            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 max-w-full"
                style={{ maxHeight: '300px' }}
            >
                {/* Grid lines */}
                {gridPoints.length > 0 && (
                    <>
                        {/* Vertical grid lines */}
                        {[...new Set(gridPoints.map((p) => p.x))].map((x, i) => (
                            <line
                                key={`v-${i}`}
                                x1={toSvgX(x)}
                                y1={toSvgY(displayMinY)}
                                x2={toSvgX(x)}
                                y2={toSvgY(displayMaxY)}
                                stroke="#ddd"
                                strokeWidth="0.5"
                            />
                        ))}
                        {/* Horizontal grid lines */}
                        {[...new Set(gridPoints.map((p) => p.y))].map((y, i) => (
                            <line
                                key={`h-${i}`}
                                x1={toSvgX(displayMinX)}
                                y1={toSvgY(y)}
                                x2={toSvgX(displayMaxX)}
                                y2={toSvgY(y)}
                                stroke="#ddd"
                                strokeWidth="0.5"
                            />
                        ))}
                    </>
                )}

                {/* Probe points */}
                {gridPoints.map((point, index) => {
                    const z = getPointZ(index);
                    const hasData = z !== null;
                    const isCurrent = isProbing && index === currentProbeIndex;
                    const isProbed = mapData ? index < mapData.points.length : false;

                    let fillColor = '#999'; // Default gray
                    if (hasData) {
                        fillColor = getZColor(z);
                    } else if (isCurrent) {
                        fillColor = '#FFD700'; // Gold for current
                    } else if (isProbed) {
                        fillColor = '#4CAF50'; // Green for probed
                    }

                    return (
                        <circle
                            key={`point-${index}`}
                            cx={toSvgX(point.x)}
                            cy={toSvgY(point.y)}
                            r={isCurrent ? 6 : 4}
                            fill={fillColor}
                            stroke={isCurrent ? '#000' : 'none'}
                            strokeWidth={isCurrent ? 2 : 0}
                            className="cursor-pointer"
                            onMouseEnter={(e) => handlePointMouseEnter(e, point, index)}
                            onMouseLeave={handlePointMouseLeave}
                        />
                    );
                })}

                {/* Axis labels */}
                <text x={svgWidth / 2} y={svgHeight - 5} textAnchor="middle" fontSize="10" fill="#666">
                    X ({displayMinX} - {displayMaxX})
                </text>
                <text
                    x={10}
                    y={svgHeight / 2}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                    transform={`rotate(-90, 10, ${svgHeight / 2})`}
                >
                    Y ({displayMinY} - {displayMaxY})
                </text>

                {/* Origin marker */}
                <circle
                    cx={toSvgX(0)}
                    cy={toSvgY(0)}
                    r={3}
                    fill="none"
                    stroke="#F00"
                    strokeWidth="1"
                />
            </svg>

            {/* Legend */}
            {mapData && mapData.points.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Z:</span>
                    <div className="w-24 h-3 rounded" style={{
                        background: 'linear-gradient(to right, rgb(0,100,255), rgb(0,200,100), rgb(255,0,0))',
                    }} />
                    <span>{minZ.toFixed(3)} - {maxZ.toFixed(3)}</span>
                </div>
            )}

            {/* Point count */}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {gridPoints.length} probe points
            </div>
        </div>
    );
};

export default GridVisualizer;
