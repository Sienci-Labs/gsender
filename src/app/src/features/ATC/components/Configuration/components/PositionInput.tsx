import React from 'react';
import { Button } from 'app/components/Button';
import { Input } from 'app/components/shadcn/Input';
import { Label } from 'app/components/shadcn/Label';
import { Position } from 'app/features/ATC/components/Configuration/hooks/useConfigStore';
import { FiTarget } from 'react-icons/fi';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState.ts';
import { mapPositionToUnits } from 'app/lib/units.ts';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

interface PositionInputProps {
    label: string;
    position: Position;
    onPositionChange: (position: Position) => void;
    onUseCurrent: () => void;
    disabled?: boolean;
    disableZ?: boolean;
    hideZ?: boolean;
    actionLabel?: string;
    hideLabel?: boolean;
}

export const PositionInput: React.FC<PositionInputProps> = ({
    label,
    position,
    onPositionChange,
    onUseCurrent,
    disabled = false,
    disableZ = false,
    hideZ = false,
    actionLabel = 'Set Position',
    hideLabel = false,
}) => {
    const { units } = useWorkspaceState();

    const handleAxisChange = (axis: keyof Position, value: string) => {
        if (disabled) return;
        const numValue = parseFloat(value) || 0;
        onPositionChange({
            ...position,
            [axis]: numValue,
        });
    };

    const unitPosition = mapValues(position, (pos, axis) => {
        if (axis === 'a') return pos;
        return String(mapPositionToUnits(pos, units));
    });

    return (
        <div className="flex flex-wrap items-center gap-3 py-1">
            {!hideLabel && (
                <Label className="text-xs font-medium">{label}</Label>
            )}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground w-4">
                        X:
                    </Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={unitPosition.x}
                        onChange={(e) => handleAxisChange('x', e.target.value)}
                        className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={disabled}
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground w-4">
                        Y:
                    </Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={unitPosition.y}
                        onChange={(e) => handleAxisChange('y', e.target.value)}
                        className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={disabled}
                    />
                </div>
                {!hideZ && (
                    <div className="flex items-center gap-1">
                        <Label className="text-xs text-muted-foreground w-4">
                            Z:
                        </Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={unitPosition.z}
                            onChange={(e) =>
                                handleAxisChange('z', e.target.value)
                            }
                            className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={disabled || disableZ}
                        />
                    </div>
                )}
                <Button
                    size="sm"
                    onClick={onUseCurrent}
                    className="h-8 text-xs px-3 flex flex-row gap-1 items-center"
                    disabled={disabled}
                >
                    <FiTarget className="h-4 w-4" />
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
};
