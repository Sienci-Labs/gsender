import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'app/components/shadcn/Card';
import { Switch } from 'app/components/shadcn/Switch';
import { Input } from 'app/components/shadcn/Input';
import { Label } from 'app/components/shadcn/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import { Button } from 'app/components/Button';
import { PositionInput } from './PositionInput';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore';
import cn from 'classnames';
import OffsetManagementWidget from 'app/features/ATC/components/Configuration/components/OffsetManagement.tsx';
import { Spinner } from 'app/components/shadcn/Spinner';
import {
    BookOpen,
    Move,
    Pencil,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';

export interface ConfigTabProps {
    uploading: boolean;
}

export const ConfigTab: React.FC = ({ uploading }: ConfigTabProps) => {
    const {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        setWorkspacePosition,
        status,
    } = useConfigContext();

    const nonDefaultStyling = 'bg-yellow-50';
    const rackSize = config.variables._tc_slots.value || 0;
    const rackEnabled = rackSize > 0;

    const handleRackSizeChange = (value: string) => {
        const nextRackSize = parseInt(value, 10) || 0;
        const nextVariables = {
            ...config.variables,
            _tc_slots: {
                ...config.variables._tc_slots,
                value: nextRackSize,
            },
            _tc_rack_enable: {
                ...config.variables._tc_rack_enable,
                value: nextRackSize === 0 ? 0 : 1,
            },
        };

        if (nextRackSize === 0) {
            nextVariables._irt_offset_mode = {
                ...config.variables._irt_offset_mode,
                value: 0,
            };
            nextVariables._ort_offset_mode = {
                ...config.variables._ort_offset_mode,
                value: 0,
            };
        }

        updateConfig({ variables: nextVariables });
    };

    const getStatusColor = () => {
        switch (status.type) {
            case 'success':
                return 'text-green-500';
            case 'error':
                return 'text-red-500';
            case 'warning':
                return 'text-orange-500';
            default:
                return 'text-muted-foreground';
        }
    };

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Tool Rack Section */}
                <Card className="border border-border shadow-none">
                    <CardHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Tool Rack
                        </CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Rack Size
                            </Label>
                            <div
                                className={cn('w-52', {
                                    [nonDefaultStyling]:
                                        config.variables._tc_slots.value !==
                                        config.variables._tc_slots.default,
                                })}
                            >
                                <Select
                                    value={String(rackSize)}
                                    onValueChange={handleRackSizeChange}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10001] bg-white">
                                        <SelectItem value="0">
                                            No tool rack
                                        </SelectItem>
                                        <SelectItem value="6">
                                            Rack with 6 tools
                                        </SelectItem>
                                        <SelectItem value="12">
                                            Rack with 12 tools
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div
                            className={cn(
                                'space-y-1',
                                !rackEnabled &&
                                    'opacity-50 pointer-events-none',
                            )}
                        >
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Rack Position
                            </Label>
                            <PositionInput
                                label="Tool Rack Position"
                                position={config.slot1Position}
                                onPositionChange={(position) =>
                                    updatePosition(
                                        'toolRack.slot1Position',
                                        position,
                                    )
                                }
                                onUseCurrent={() => setWorkspacePosition('P7')}
                                disabled={!rackEnabled}
                                actionLabel="Set Manually"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tool Length Sensor Section */}
                <Card className="border border-border shadow-none">
                    <CardHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Tool Length Sensor
                        </CardTitle>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground">
                            Sensor Position
                        </Label>
                        <PositionInput
                            label="Tool Length Sensor Position"
                            position={config.tlsPosition}
                            onPositionChange={(position) =>
                                updatePosition(
                                    'toolLengthSensorPosition',
                                    position,
                                )
                            }
                            onUseCurrent={() => setWorkspacePosition('P9')}
                            disableZ
                            actionLabel="Set Manually"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Section */}
            <Card className="border border-border shadow-none">
                <CardHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">
                        Advanced Settings
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Offset Management
                                    </Label>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        When loading from tool rack
                                    </Label>
                                    <OffsetManagementWidget
                                        value={
                                            config.variables._irt_offset_mode
                                                .value
                                        }
                                        defaultValue={
                                            config.variables._irt_offset_mode
                                                .default
                                        }
                                        onChange={(value) =>
                                            updateConfig({
                                                variables: {
                                                    ...config.variables,
                                                    _irt_offset_mode: {
                                                        ...config.variables
                                                            ._irt_offset_mode,
                                                        value,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        When loading manually
                                    </Label>
                                    <OffsetManagementWidget
                                        value={
                                            config.variables._ort_offset_mode
                                                .value
                                        }
                                        defaultValue={
                                            config.variables._ort_offset_mode
                                                .default
                                        }
                                        onChange={(value) =>
                                            updateConfig({
                                                variables: {
                                                    ...config.variables,
                                                    _ort_offset_mode: {
                                                        ...config.variables
                                                            ._ort_offset_mode,
                                                        value,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Move className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Manual Change Position
                                    </Label>
                                </div>
                                <PositionInput
                                    label="Manual Tool Change Position"
                                    position={config.manualLoadPosition}
                                    onPositionChange={(position) =>
                                        updatePosition(
                                            'manualToolLoadPosition',
                                            position,
                                        )
                                    }
                                    onUseCurrent={() =>
                                        setWorkspacePosition('P8')
                                    }
                                    disableZ
                                    actionLabel="Set Manually"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Safety Checks
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    <div
                                        className={cn(
                                            'flex items-center gap-2',
                                            {
                                                [nonDefaultStyling]:
                                                    config.variables._pres_sense
                                                        .value !==
                                                    config.variables._pres_sense
                                                        .default,
                                            },
                                        )
                                    >
                                        <Label className="text-xs font-medium">
                                            Pressure Sensor
                                        </Label>
                                        <Switch
                                            checked={
                                                config.variables._pres_sense
                                                    .value === 1
                                            }
                                            onChange={(checked) =>
                                                updateConfig({
                                                    variables: {
                                                        ...config.variables,
                                                        _pres_sense: {
                                                            ...config.variables
                                                                ._pres_sense,
                                                            value: checked
                                                                ? 1
                                                                : 0,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        Check pressure before tool change
                                    </div>
                                    <div
                                        className={cn(
                                            'flex items-center gap-2',
                                            {
                                                [nonDefaultStyling]:
                                                    config.variables
                                                        ._holder_sense.value !==
                                                    config.variables
                                                        ._holder_sense.default,
                                            },
                                        )
                                    >
                                        <Label className="text-xs font-medium">
                                            Tool-stud Sensor
                                        </Label>
                                        <Switch
                                            checked={
                                                config.variables._holder_sense
                                                    .value === 1
                                            }
                                            onChange={(checked) =>
                                                updateConfig({
                                                    variables: {
                                                        ...config.variables,
                                                        _holder_sense: {
                                                            ...config.variables
                                                                ._holder_sense,
                                                            value: checked
                                                                ? 1
                                                                : 0,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        Check tool collision before tool unload
                                    </div>
                                </div>
                            </div>
                            <div
                                className={cn('space-y-1', {
                                    [nonDefaultStyling]:
                                        config.variables._tc_slot_offset
                                            .value !==
                                        config.variables._tc_slot_offset
                                            .default,
                                })}
                            >
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Other
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-medium">
                                        Tool Fork Spacing (mm)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={
                                            config.variables._tc_slot_offset
                                                .value
                                        }
                                        onChange={(e) =>
                                            updateConfig({
                                                variables: {
                                                    ...config.variables,
                                                    _tc_slot_offset: {
                                                        ...config.variables
                                                            ._tc_slot_offset,
                                                        value:
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                    },
                                                },
                                            })
                                        }
                                        className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Advanced
                                    </Label>
                                </div>
                                <div
                                    className={cn('flex items-center gap-2', {
                                        [nonDefaultStyling]:
                                            config.variables
                                                ._passthrough_offset_setting
                                                .value !==
                                            config.variables
                                                ._passthrough_offset_setting
                                                .default,
                                    })}
                                >
                                    <Label className="text-xs font-medium">
                                        Retain tool table settings when rack
                                        removed
                                    </Label>
                                    <Switch
                                        checked={
                                            config.variables
                                                ._passthrough_offset_setting
                                                .value === 1
                                        }
                                        onChange={(checked) =>
                                            updateConfig({
                                                variables: {
                                                    ...config.variables,
                                                    _passthrough_offset_setting:
                                                        {
                                                            ...config.variables
                                                                ._passthrough_offset_setting,
                                                            value: checked
                                                                ? 1
                                                                : 0,
                                                        },
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Apply Section */}
            <div className="flex items-center gap-3 pt-1 flex-1 min-h-0">
                {/* Status/Progress Section - 60% */}
                <div className="flex-1 space-y-1 flex flex-col justify-center">
                    {uploading && (
                        <div className="flex flex-row gap-2 items-center">
                            <Spinner className="h-4 w-4" />
                            <span>{status.message}</span>
                        </div>
                    )}

                    {status.message && !uploading && (
                        <div className={cn('text-xs', getStatusColor())}>
                            {status.message}
                        </div>
                    )}
                </div>

                {/* Apply Button - 40% */}
                <div className="w-2/5 flex items-center justify-end">
                    <Button onClick={applyConfig} disabled={uploading}>
                        {uploading ? 'Applying...' : 'Apply'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
