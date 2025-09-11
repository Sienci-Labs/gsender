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
import { useConfigStore } from 'app/features/ATC/components/Configuration/hooks/useConfigStore';
import cn from 'classnames';

export const ConfigTab: React.FC = () => {
    const {
        config,
        updateConfig,
        updatePosition,
        applyConfig,
        useCurrent,
        isApplying,
        progress,
        status,
    } = useConfigStore();

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
        <div className="space-y-3 flex flex-col h-full">
            {/* General Section */}
            <Card className="border border-border p-0">
                <CardHeader className="pb-2">
                    <CardTitle>General</CardTitle>
                </CardHeader>
                <CardContent>
                    <PositionInput
                        label="Tool Length Sensor Position"
                        position={config.toolLengthSensorPosition}
                        onPositionChange={(position) =>
                            updatePosition('toolLengthSensorPosition', position)
                        }
                        onUseCurrent={() =>
                            useCurrent('toolLengthSensorPosition')
                        }
                    />

                    <PositionInput
                        label="Manual Tool Load Position"
                        position={config.manualToolLoadPosition}
                        onPositionChange={(position) =>
                            updatePosition('manualToolLoadPosition', position)
                        }
                        onUseCurrent={() =>
                            useCurrent('manualToolLoadPosition')
                        }
                    />

                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            Offset Management
                        </Label>
                        <div className="space-y-1.5 pl-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">
                                    Probe new offset when tool changing
                                </Label>
                                <Switch
                                    checked={
                                        config.offsetManagement
                                            .probeNewOffset === 1
                                    }
                                    onChange={(checked) =>
                                        updateConfig({
                                            offsetManagement: {
                                                ...config.offsetManagement,
                                                probeNewOffset: checked ? 1 : 0,
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">
                                    Use tool table offset
                                </Label>
                                <Switch
                                    checked={
                                        config.offsetManagement
                                            .useToolOffset === 1
                                    }
                                    onChange={(checked) =>
                                        updateConfig({
                                            offsetManagement: {
                                                ...config.offsetManagement,
                                                useToolOffset: checked ? 1 : 0,
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">
                                    Verify tool length changes
                                </Label>
                                <Switch
                                    checked={
                                        config.offsetManagement
                                            .verifyToolLength === 1
                                    }
                                    onChange={(checked) =>
                                        updateConfig({
                                            offsetManagement: {
                                                ...config.offsetManagement,
                                                verifyToolLength: checked
                                                    ? 1
                                                    : 0,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tool Rack Section */}
            <Card className="border border-border p-0">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-4">
                        Tool Rack
                        <Switch
                            checked={config.toolRack.enabled === 1}
                            onChange={(checked) =>
                                updateConfig({
                                    toolRack: {
                                        ...config.toolRack,
                                        enabled: checked ? 1 : 0,
                                    },
                                })
                            }
                        />
                    </CardTitle>
                </CardHeader>
                {config.toolRack.enabled === 1 && (
                    <CardContent className="space-y-1">
                        <div className="flex items-end gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Number of Racks
                                </Label>
                                <Input
                                    type="number"
                                    value={config.toolRack.numberOfRacks}
                                    onChange={(e) =>
                                        updateConfig({
                                            toolRack: {
                                                ...config.toolRack,
                                                numberOfRacks:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            },
                                        })
                                    }
                                    className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex-1">
                                <PositionInput
                                    label="Slot 1 Position"
                                    position={config.toolRack.slot1Position}
                                    onPositionChange={(position) =>
                                        updatePosition(
                                            'toolRack.slot1Position',
                                            position,
                                        )
                                    }
                                    onUseCurrent={() =>
                                        useCurrent('toolRack.slot1Position')
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">
                                Offset Management
                            </Label>
                            <div className="space-y-1.5 pl-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">
                                        Probe new offset when tool changing
                                    </Label>
                                    <Switch
                                        checked={
                                            config.toolRack.offsetManagement
                                                .probeNewOffset === 1
                                        }
                                        onChange={(checked) =>
                                            updateConfig({
                                                toolRack: {
                                                    ...config.toolRack,
                                                    offsetManagement: {
                                                        ...config.toolRack
                                                            .offsetManagement,
                                                        probeNewOffset: checked
                                                            ? 1
                                                            : 0,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">
                                        Use tool table offset
                                    </Label>
                                    <Switch
                                        checked={
                                            config.toolRack.offsetManagement
                                                .useToolOffset === 1
                                        }
                                        onChange={(checked) =>
                                            updateConfig({
                                                toolRack: {
                                                    ...config.toolRack,
                                                    offsetManagement: {
                                                        ...config.toolRack
                                                            .offsetManagement,
                                                        useToolOffset: checked
                                                            ? 1
                                                            : 0,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">
                                        Verify tool length changes
                                    </Label>
                                    <Switch
                                        checked={
                                            config.toolRack.offsetManagement
                                                .verifyToolLength === 1
                                        }
                                        onChange={(checked) =>
                                            updateConfig({
                                                toolRack: {
                                                    ...config.toolRack,
                                                    offsetManagement: {
                                                        ...config.toolRack
                                                            .offsetManagement,
                                                        verifyToolLength:
                                                            checked ? 1 : 0,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Advanced Section */}
            <Card className="border border-border">
                <CardHeader className="pb-2">
                    <CardTitle>Advanced</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">
                            Check pressure with pressure sensor
                        </Label>
                        <Switch
                            checked={config.advanced.checkPressure === 1}
                            onChange={(checked) =>
                                updateConfig({
                                    advanced: {
                                        ...config.advanced,
                                        checkPressure: checked ? 1 : 0,
                                    },
                                })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">
                            Check tool presence in rack to prevent collision
                        </Label>
                        <Switch
                            checked={config.advanced.checkToolPresence === 1}
                            onChange={(checked) =>
                                updateConfig({
                                    advanced: {
                                        ...config.advanced,
                                        checkToolPresence: checked ? 1 : 0,
                                    },
                                })
                            }
                        />
                    </div>
                </CardContent>
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
