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
import cn from 'classnames';
import { AlertCircle } from 'lucide-react';

interface PositionInputProps {
    label: string;
    position: Position;
    onPositionChange: (position: Position) => void;
    onUseCurrent: () => void;
    disabled?: boolean;
    disableZ?: boolean;
    hideZ?: boolean;
    actionLabel?: string;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    secondaryActionDisabled?: boolean;
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
    secondaryActionLabel,
    onSecondaryAction,
    secondaryActionDisabled = false,
    hideLabel = false,
}) => {
    const { units } = useWorkspaceState();
    const hasSecondaryAction = Boolean(secondaryActionLabel && onSecondaryAction);
    const validateZ = !disableZ && !hideZ;
    const hasZeroAxis =
        !disabled &&
        (position.x === 0 ||
            position.y === 0 ||
            (validateZ && position.z === 0));
    const validationText = validateZ
        ? 'X, Y, and Z should not be 0.'
        : 'X and Y should not be 0.';
    const validationMessage = `${validationText} Verify the offsets are correct.`;

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
        <div className="flex flex-wrap items-start gap-3 py-1 w-full">
            {!hideLabel && (
                <Label className="text-xs font-medium text-gray-700 dark:text-white">
                    {label}
                </Label>
            )}
            <div className="flex items-start gap-2 flex-1 w-full">
                <div
                    className={cn(
                        'flex flex-col gap-2 rounded-md border p-2 w-full flex-1',
                        hasZeroAxis
                            ? 'border-orange-400 bg-orange-50/10 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-slate-700 dark:bg-slate-800',
                    )}
                    style={
                        hasZeroAxis
                            ? {
                                  backgroundImage:
                                      'repeating-linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0, rgba(249, 115, 22, 0.05) 8px, transparent 8px, transparent 16px)',
                              }
                            : undefined
                    }
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 flex-1 min-w-[6.5rem]">
                            <Label className="text-xs text-muted-foreground dark:text-gray-300 w-4">
                                X:
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={unitPosition.x}
                                onChange={(e) =>
                                    handleAxisChange('x', e.target.value)
                                }
                                className={cn(
                                    'w-full h-8 text-xs border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500',
                                    hasZeroAxis &&
                                        'border-orange-400 focus:border-orange-500 focus:ring-orange-500',
                                )}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex items-center gap-1 flex-1 min-w-[6.5rem]">
                            <Label className="text-xs text-muted-foreground dark:text-gray-300 w-4">
                                Y:
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={unitPosition.y}
                                onChange={(e) =>
                                    handleAxisChange('y', e.target.value)
                                }
                                className={cn(
                                    'w-full h-8 text-xs border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500',
                                    hasZeroAxis &&
                                        'border-orange-400 focus:border-orange-500 focus:ring-orange-500',
                                )}
                                disabled={disabled}
                            />
                        </div>
                        {!hideZ && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 flex-1 min-w-[6.5rem]',
                                    disableZ && 'max-xl:hidden',
                                )}
                            >
                                <Label className="text-xs text-muted-foreground dark:text-gray-300 w-4">
                                    Z:
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={unitPosition.z}
                                    onChange={(e) =>
                                        handleAxisChange('z', e.target.value)
                                    }
                                    className={cn(
                                        'w-full h-8 text-xs border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500',
                                        hasZeroAxis &&
                                            'border-orange-400 focus:border-orange-500 focus:ring-orange-500',
                                    )}
                                    disabled={disabled || disableZ}
                                />
                            </div>
                        )}
                    </div>
                    <div
                        className={cn(
                            'w-full',
                            hasSecondaryAction && 'grid grid-cols-2 gap-2',
                        )}
                    >
                        <Button
                            size="sm"
                            onClick={onUseCurrent}
                            className="h-8 text-xs px-3 flex flex-row gap-1 items-center justify-center w-full"
                            disabled={disabled}
                        >
                            <FiTarget className="h-4 w-4" />
                            {actionLabel}
                        </Button>
                        {hasSecondaryAction && (
                            <Button
                                size="sm"
                                onClick={onSecondaryAction}
                                className="h-8 text-xs px-3 flex flex-row items-center justify-center w-full"
                                disabled={disabled || secondaryActionDisabled}
                            >
                                {secondaryActionLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    'h-9 w-9 shrink-0',
                    !hasZeroAxis && 'invisible',
                )}
            >
                <div className="h-9 w-9 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm ring-2 ring-orange-200 dark:ring-orange-900/50">
                    <AlertCircle className="h-6 w-6" />
                </div>
            </div>
            <div
                className={cn(
                    'basis-full h-4 text-xs font-semibold text-red-500 flex items-center gap-1',
                    !hasZeroAxis && 'invisible',
                )}
            >
                <span className="leading-none">{validationMessage}</span>
            </div>
        </div>
    );
};
