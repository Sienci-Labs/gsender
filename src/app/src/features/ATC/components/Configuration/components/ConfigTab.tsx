import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'app/components/shadcn/card';
import { Switch } from 'app/components/shadcn/switch';
import { Input } from 'app/components/shadcn/input';
import { Label } from 'app/components/shadcn/label';
import { Button } from 'app/components/Button';
import { Progress } from 'app/components/shadcn/progress';
import { PositionInput } from './PositionInput';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore';
import cn from 'classnames';
import OffsetManagementWidget from 'app/features/ATC/components/Configuration/components/OffsetManagement.tsx';

export const ConfigTab: React.FC = () => {
    const {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        setWorkspacePosition,
        isApplying,
        progress,
        status,
    } = useConfigContext();

    const nonDefaultStyling = 'bg-yellow-50';

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
        <div className="space-y-1 flex flex-col h-full">
            {/* General Section */}
            <Card className="border border-border p-0">
                <CardHeader className="pb-2">
                    <CardTitle>General</CardTitle>
                </CardHeader>
                <div className="p-2">
                    <PositionInput
                        label="Tool Length Sensor Position"
                        position={config.tlsPosition}
                        onPositionChange={(position) =>
                            updatePosition('toolLengthSensorPosition', position)
                        }
                        onUseCurrent={() => setWorkspacePosition('P9')}
                    />

                    <PositionInput
                        label="Manual Tool Load Position"
                        position={config.manualLoadPosition}
                        onPositionChange={(position) =>
                            updatePosition('manualToolLoadPosition', position)
                        }
                        onUseCurrent={() => setWorkspacePosition('P8')}
                    />

                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            Offset Management
                        </Label>
                        <OffsetManagementWidget
                            value={config.variables._ort_offset_mode.value}
                            defaultValue={
                                config.variables._ort_offset_mode.default
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
            </Card>

            {/* Tool Rack Section */}
            <Card className="border border-border p-0">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-4">
                        Tool Rack
                        <Switch
                            className={cn({
                                [nonDefaultStyling]:
                                    config.variables._tc_rack_enable.value !==
                                    config.variables._tc_rack_enable.default,
                            })}
                            checked={
                                config.variables._tc_rack_enable.value === 1
                            }
                            onChange={(checked) =>
                                updateConfig({
                                    variables: {
                                        ...config.variables,
                                        _tc_rack_enable: {
                                            ...config.variables._tc_rack_enable,
                                            value: checked ? 1 : 0,
                                        },
                                    },
                                })
                            }
                        />
                    </CardTitle>
                </CardHeader>
                <div
                    className={cn(
                        'p-2',
                        config.variables._tc_rack_enable.value !== 1 &&
                            'opacity-50 pointer-events-none',
                    )}
                >
                    <div className="flex gap-4 w-full space-between">
                        <div
                            className={cn(
                                'flex flex-row items-center gap-2 justify-center',
                                {
                                    [nonDefaultStyling]:
                                        config.variables._tc_slots.value !==
                                        config.variables._tc_slots.default,
                                },
                            )}
                        >
                            <Label className="text-sm font-medium">
                                Number of Slots
                            </Label>
                            <Input
                                type="number"
                                value={config.variables._tc_slots.value}
                                onChange={(e) =>
                                    updateConfig({
                                        variables: {
                                            ...config.variables,
                                            _tc_slots: {
                                                ...config.variables._tc_slots,
                                                value:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            },
                                        },
                                    })
                                }
                                className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={
                                    config.variables._tc_rack_enable.value !== 1
                                }
                            />
                        </div>
                        <div
                            className={cn(
                                'flex flex-row items-center gap-2 justify-center',
                                {
                                    [nonDefaultStyling]:
                                        config.variables._tc_slot_offset
                                            .value !==
                                        config.variables._tc_slot_offset
                                            .default,
                                },
                            )}
                        >
                            <Label className="text-sm font-medium">
                                Slot Offset
                            </Label>
                            <Input
                                type="number"
                                value={config.variables._tc_slot_offset.value}
                                onChange={(e) =>
                                    updateConfig({
                                        variables: {
                                            ...config.variables,
                                            _tc_slot_offset: {
                                                ...config.variables
                                                    ._tc_slot_offset,
                                                value:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            },
                                        },
                                    })
                                }
                                className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={
                                    config.variables._tc_rack_enable.value !== 1
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex-1">
                            <PositionInput
                                label="Slot 1 Position"
                                position={config.slot1Position}
                                onPositionChange={(position) =>
                                    updatePosition(
                                        'toolRack.slot1Position',
                                        position,
                                    )
                                }
                                onUseCurrent={() => setWorkspacePosition('P7')}
                                disabled={
                                    config.variables._tc_rack_enable.value !== 1
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Offset Management</Label>
                        <OffsetManagementWidget
                            value={config.variables._irt_offset_mode.value}
                            defaultValue={
                                config.variables._irt_offset_mode.default
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
                        <Label className="text-sm font-medium">Advanced</Label>
                        <div
                            className={cn('space-y-1.5 pl-4', {
                                [nonDefaultStyling]:
                                    config.variables._passthrough_offset_setting
                                        .value !==
                                    config.variables._passthrough_offset_setting
                                        .default,
                            })}
                        >
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">
                                    Retain tool table settings when rack removed
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
                                                _passthrough_offset_setting: {
                                                    ...config.variables
                                                        ._passthrough_offset_setting,
                                                    value: checked ? 1 : 0,
                                                },
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Advanced Section */}
            <Card className="border border-border">
                <CardHeader className="pb-2">
                    <CardTitle>Advanced</CardTitle>
                </CardHeader>
                <div className="p-2">
                    <div
                        className={cn('flex items-center justify-between', {
                            [nonDefaultStyling]:
                                config.variables._pres_sense.value !==
                                config.variables._pres_sense.default,
                        })}
                    >
                        <Label className="text-xs">
                            Check pressure with pressure sensor
                        </Label>
                        <Switch
                            checked={config.variables._pres_sense.value === 1}
                            onChange={(checked) =>
                                updateConfig({
                                    variables: {
                                        ...config.variables,
                                        _pres_sense: {
                                            ...config.variables._pres_sense,
                                            value: checked ? 1 : 0,
                                        },
                                    },
                                })
                            }
                        />
                    </div>
                    <div
                        className={cn('flex items-center justify-between', {
                            [nonDefaultStyling]:
                                config.variables._holder_sense.value !==
                                config.variables._holder_sense.default,
                        })}
                    >
                        <Label className="text-xs">
                            Check tool presence in rack to prevent collision
                        </Label>
                        <Switch
                            checked={config.variables._holder_sense.value === 1}
                            onChange={(checked) =>
                                updateConfig({
                                    variables: {
                                        ...config.variables,
                                        _holder_sense: {
                                            ...config.variables._holder_sense,
                                            value: checked ? 1 : 0,
                                        },
                                    },
                                })
                            }
                        />
                    </div>
                </div>
            </Card>

            {/* Apply Section */}
            <div className="flex items-center gap-3 pt-1 flex-1 min-h-0">
                {/* Status/Progress Section - 60% */}
                <div className="flex-1 space-y-1 flex flex-col justify-center">
                    {isApplying && (
                        <>
                            <Progress value={progress} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                                {progress}% complete
                            </div>
                        </>
                    )}

                    {status.message && !isApplying && (
                        <div className={cn('text-xs', getStatusColor())}>
                            {status.message}
                        </div>
                    )}
                </div>

                {/* Apply Button - 40% */}
                <div className="w-2/5 flex items-center justify-end">
                    <Button onClick={applyConfig} disabled={isApplying}>
                        {isApplying ? 'Applying...' : 'Apply'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
