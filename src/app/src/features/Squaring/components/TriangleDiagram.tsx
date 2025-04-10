import { useSquaring } from '../context/SquaringContext';

const TriangleDiagram = () => {
    const { currentMainStep, currentSubStep, mainSteps, triangle } =
        useSquaring();

    // Make the triangle responsive to container width
    const baseSize = 200; // This will be the reference size
    const padding = 15;
    const containerWidth = baseSize + 2 * padding;

    const positions = {
        'bottom-left': { x: padding, y: baseSize - padding },
        'bottom-right': { x: baseSize - padding, y: baseSize - padding },
        top: { x: baseSize - padding, y: padding },
    };

    // Get current step data
    const currentMainStepData = mainSteps[currentMainStep];
    const currentSubStepData = currentMainStepData?.subSteps[currentSubStep];

    // Determine which points should be shown based on the current step
    const getPointVisibility = (index: number) => {
        if (currentMainStep === 0) {
            // In marking phase, show points only after they've been marked
            const markedPoints = currentMainStepData.subSteps.reduce(
                (count, step, stepIndex) => {
                    if (
                        stepIndex <= currentSubStep &&
                        step.buttonLabel.includes('Mark Point')
                    ) {
                        return count + 1;
                    }
                    return count;
                },
                0,
            );
            return index < markedPoints;
        }
        // In other phases, show all points
        return true;
    };

    // Check if a point should be pulsing (during marking steps)
    const shouldPointPulse = (index: number) => {
        if (
            currentMainStep === 0 &&
            currentSubStepData?.buttonLabel.includes('Mark Point')
        ) {
            const pointNumber = currentSubStepData.buttonLabel.slice(-1);
            return index === Number(pointNumber) - 1;
        }
        return false;
    };

    // Check if a measurement line should be pulsing
    const shouldLinePulse = (lineIndex: number) => {
        if (currentMainStep === 1) {
            if (currentSubStepData?.buttonLabel.includes('1-2'))
                return lineIndex === 0;
            if (currentSubStepData?.buttonLabel.includes('2-3'))
                return lineIndex === 1;
            if (currentSubStepData?.buttonLabel.includes('1-3'))
                return lineIndex === 2;
        }
        return false;
    };

    // Draw lines between the points
    const lines = [
        // Bottom line (1-2)
        `M ${positions['bottom-left'].x} ${positions['bottom-left'].y} L ${positions['bottom-right'].x} ${positions['bottom-right'].y}`,
        // Right line (2-3)
        `M ${positions['bottom-right'].x} ${positions['bottom-right'].y} L ${positions['top'].x} ${positions['top'].y}`,
        // Diagonal line (1-3)
        `M ${positions['bottom-left'].x} ${positions['bottom-left'].y} L ${positions['top'].x} ${positions['top'].y}`,
    ];

    // Calculate if each line should be solid (measured) or dashed (not measured yet)
    const lineStyles = [
        triangle.a
            ? 'stroke-blue-500'
            : shouldLinePulse(0)
              ? 'stroke-green-500 animate-pulse'
              : 'stroke-gray-300 stroke-dashed',
        triangle.b
            ? 'stroke-blue-500'
            : shouldLinePulse(1)
              ? 'stroke-green-500 animate-pulse'
              : 'stroke-gray-300 stroke-dashed',
        triangle.c
            ? 'stroke-blue-500'
            : shouldLinePulse(2)
              ? 'stroke-green-500 animate-pulse'
              : 'stroke-gray-300 stroke-dashed',
    ];

    // Show movement arrows during marking phase
    const showMovementArrow =
        currentMainStep === 0 &&
        currentSubStepData?.buttonLabel?.includes('Move');
    const getArrowDirection = () => {
        if (!showMovementArrow) return null;
        if (currentSubStepData.buttonLabel.includes('X')) return 'horizontal';
        if (currentSubStepData.buttonLabel.includes('Y')) return 'vertical';
        return null;
    };

    const arrowDirection = getArrowDirection();

    // Get measurement labels for lines
    const getMeasurementLabel = (lineIndex: number) => {
        if (currentMainStep !== 1) return null;
        const distances = [
            { points: '1-2', value: triangle.a, key: 'a' as const },
            { points: '2-3', value: triangle.b, key: 'b' as const },
            { points: '1-3', value: triangle.c, key: 'c' as const },
        ];
        return distances[lineIndex].value
            ? `${distances[lineIndex].value}mm`
            : `Measure ${distances[lineIndex].points}`;
    };

    return (
        <div className="relative w-[370px] border border-gray-200 rounded-lg">
            <svg
                viewBox={`0 0 ${containerWidth} ${containerWidth}`}
                // className="absolute inset-0 w-full h-full"
            >
                {/* Draw the lines */}
                {lines.map((d, i) => (
                    <g key={i}>
                        <path
                            d={d}
                            className={`stroke-2 ${lineStyles[i]} fill-none`}
                        />
                        {currentMainStep === 1 && (
                            <text
                                x={
                                    i === 0
                                        ? baseSize / 2
                                        : i === 1
                                          ? baseSize - padding + 25
                                          : baseSize / 2 - 20
                                }
                                y={
                                    i === 0
                                        ? baseSize - padding + 25
                                        : i === 1
                                          ? baseSize / 2
                                          : baseSize / 2 - 20
                                }
                                className={`${
                                    shouldLinePulse(i)
                                        ? 'fill-green-700'
                                        : (i === 0 && triangle.a) ||
                                            (i === 1 && triangle.b) ||
                                            (i === 2 && triangle.c)
                                          ? 'fill-blue-700'
                                          : 'fill-gray-500'
                                }`}
                                textAnchor="middle"
                                transform={
                                    i === 1
                                        ? `rotate(-90 ${baseSize - padding + 25} ${baseSize / 2})`
                                        : undefined
                                }
                                style={{
                                    fontSize: '10px',
                                }}
                            >
                                {getMeasurementLabel(i)}
                            </text>
                        )}
                    </g>
                ))}

                {/* Right angle indicator */}
                <path
                    d={`M ${positions['bottom-right'].x} ${positions['bottom-right'].y - 20} L ${positions['bottom-right'].x} ${positions['bottom-right'].y} L ${positions['bottom-right'].x - 20} ${positions['bottom-right'].y}`}
                    className="stroke-2 stroke-orange-50 fill-none"
                />

                {/* Movement Arrows with Labels */}
                {arrowDirection === 'horizontal' && (
                    <>
                        <line
                            x1={padding + 15}
                            y1={baseSize - padding + 15}
                            x2={baseSize - padding - 15}
                            y2={baseSize - padding + 15}
                            className="stroke-2 stroke-green-500"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={baseSize / 2}
                            y={baseSize - padding + 30}
                            className="text-xs fill-green-700 text-center"
                            textAnchor="middle"
                            style={{
                                fontSize: '10px',
                            }}
                        >
                            {currentSubStepData?.value}mm X-axis
                        </text>
                    </>
                )}
                {arrowDirection === 'vertical' && (
                    <>
                        <line
                            x1={baseSize - padding + 15}
                            y1={baseSize - padding - 15}
                            x2={baseSize - padding + 15}
                            y2={padding + 15}
                            className="stroke-2 stroke-green-500"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={baseSize - padding + 30}
                            y={baseSize / 2}
                            className="fill-green-700"
                            textAnchor="middle"
                            transform={`rotate(-90 ${baseSize - padding + 35} ${baseSize / 2})`}
                            style={{
                                fontSize: '10px',
                            }}
                        >
                            {currentSubStepData?.value}mm Y-axis
                        </text>
                    </>
                )}

                {/* Arrow marker definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            className="fill-green-500"
                        />
                    </marker>
                </defs>
            </svg>

            {/* Points */}
            {Object.entries(positions).map(
                ([key, pos], index) =>
                    getPointVisibility(index) && (
                        <>
                            <div
                                key={key}
                                className={`absolute text-lg w-10 h-10 -ml-5 -mt-5 [transform:rotate(45deg)] [-ms-transform:rotate(45deg)] [-webkit-transform:rotate(45deg)] before:absolute before:-z-1 before:left-1/2 before:w-1/3 before:-ml-[15%] before:h-full after:absolute after:-z-1 after:top-1/2 after:h-1/3 after:-mt-[15%] after:w-full flex items-center justify-center font-bold text-white transition-colors ${
                                    shouldPointPulse(index)
                                        ? 'before:bg-green-500 after:bg-green-500 animate-pulse'
                                        : currentMainStep === 0 &&
                                            index === currentSubStep
                                          ? 'before:bg-green-500 after:bg-green-500'
                                          : 'before:bg-blue-500 after:bg-blue-500'
                                }`}
                                style={{
                                    left: `${(pos.x / containerWidth) * 100}%`,
                                    top: `${(pos.y / containerWidth) * 100}%`,
                                }}
                            />
                            <div
                                className="absolute text-lg w-8 h-8 -ml-4 -mt-[15px] flex items-center justify-center font-bold text-white stroke-black"
                                style={{
                                    left: `${(pos.x / containerWidth) * 100}%`,
                                    top: `${(pos.y / containerWidth) * 100}%`,
                                }}
                            >
                                {index + 1}
                            </div>
                        </>
                    ),
            )}
        </div>
    );
};

export default TriangleDiagram;
