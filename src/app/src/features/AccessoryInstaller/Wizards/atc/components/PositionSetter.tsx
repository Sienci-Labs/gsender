import { useState, useEffect, ReactNode } from 'react';

interface PositionSetterProps {
    xPosition: string;
    yPosition: string;
    zPosition?: string;
    onPositionChange: (positions: { x: string; y: string; z?: string }) => void;
    showZ?: boolean;
    label?: string;
    actionButton?: ReactNode;
}

export function PositionSetter({
    xPosition: initialX,
    yPosition: initialY,
    zPosition: initialZ,
    onPositionChange,
    showZ = false,
    label = 'Position',
    actionButton,
}: PositionSetterProps) {
    const [x, setX] = useState(initialX);
    const [y, setY] = useState(initialY);
    const [z, setZ] = useState(initialZ || '0');

    useEffect(() => {
        setX(initialX);
    }, [initialX]);

    useEffect(() => {
        setY(initialY);
    }, [initialY]);

    useEffect(() => {
        if (initialZ !== undefined) {
            setZ(initialZ);
        }
    }, [initialZ]);

    const handleXChange = (value: string) => {
        setX(value);
        onPositionChange({ x: value, y, ...(showZ && { z }) });
    };

    const handleYChange = (value: string) => {
        setY(value);
        onPositionChange({ x, y: value, ...(showZ && { z }) });
    };

    const handleZChange = (value: string) => {
        setZ(value);
        onPositionChange({ x, y, z: value });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {label}
                </label>
                <div
                    className={`grid gap-4 ${showZ ? 'grid-cols-3' : 'grid-cols-2'}`}
                >
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            X
                        </label>
                        <input
                            type="text"
                            value={x}
                            onChange={(e) => handleXChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Y
                        </label>
                        <input
                            type="text"
                            value={y}
                            onChange={(e) => handleYChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {showZ && (
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">
                                Z
                            </label>
                            <input
                                type="text"
                                value={z}
                                onChange={(e) => handleZChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}
                </div>
            </div>

            {actionButton && <div>{actionButton}</div>}
        </div>
    );
}
