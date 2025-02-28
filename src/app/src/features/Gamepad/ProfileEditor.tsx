import { useState, useEffect } from 'react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from 'app/components/shadcn/Dialog';
import { Button } from 'app/components/shadcn/Button';
import { Input } from 'app/components/shadcn/Input';
import { Label } from 'app/components/shadcn/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'app/components/shadcn/Card';
import { Switch } from 'app/components/shadcn/Switch';

import { GamepadProfile, GamepadAction, AxisSettings, JogAxis } from './types';

type Props = {
    profile: GamepadProfile;
    onSave: (profile: GamepadProfile) => void;
    onCancel: () => void;
    open: boolean;
};

export const ProfileEditor = ({ profile, onSave, onCancel, open }: Props) => {
    const [editedProfile, setEditedProfile] = useState<GamepadProfile>({
        ...profile,
    });
    const [selectedButton, setSelectedButton] = useState<number | null>(null);
    const [selectedAxis, setSelectedAxis] = useState<number | null>(null);
    const [listeningForInput, setListeningForInput] = useState(false);

    useEffect(() => {
        let frameId: number;

        const checkGamepadInput = () => {
            if (!listeningForInput) return;

            const gamepads = navigator.getGamepads();
            gamepads.forEach((gamepad) => {
                if (!gamepad) return;

                // Check for button presses
                gamepad.buttons.forEach((button, index) => {
                    if (button.pressed) {
                        setSelectedButton(index);
                        setListeningForInput(false);
                    }
                });

                // Check for axis movement
                gamepad.axes.forEach((value, index) => {
                    if (Math.abs(value) > 0.5) {
                        setSelectedAxis(index);
                        setListeningForInput(false);
                    }
                });
            });

            frameId = requestAnimationFrame(checkGamepadInput);
        };

        if (listeningForInput) {
            frameId = requestAnimationFrame(checkGamepadInput);
        }

        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [listeningForInput]);

    const handleNameChange = (name: string) => {
        setEditedProfile((prev) => ({ ...prev, name }));
    };

    const handleDeadzoneChange = (deadzone: number) => {
        setEditedProfile((prev) => ({ ...prev, deadzone }));
    };

    const handleButtonActionChange = (
        buttonIndex: number,
        action: GamepadAction,
    ) => {
        setEditedProfile((prev) => ({
            ...prev,
            buttonMappings: {
                ...prev.buttonMappings,
                [buttonIndex]: action,
            },
        }));
    };

    const handleAxisSettingsChange = (
        axisIndex: number,
        settings: AxisSettings,
    ) => {
        setEditedProfile((prev) => ({
            ...prev,
            axisSettings: {
                ...prev.axisSettings,
                [axisIndex]: settings,
            },
        }));
    };

    const handleSave = () => {
        onSave(editedProfile);
    };

    return (
        <Dialog open={open} onOpenChange={() => onCancel()}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {profile.id ? 'Edit Profile' : 'Create New Profile'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Profile Name</Label>
                            <Input
                                value={editedProfile.name}
                                onChange={(e) =>
                                    handleNameChange(e.target.value)
                                }
                                placeholder="Enter profile name"
                            />
                        </div>

                        <div>
                            <Label>Default Deadzone</Label>
                            <Input
                                type="number"
                                value={editedProfile.deadzone}
                                onChange={(e) =>
                                    handleDeadzoneChange(Number(e.target.value))
                                }
                                min="0"
                                max="1"
                                step="0.05"
                            />
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Button Mappings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setListeningForInput(true)}
                                variant={
                                    listeningForInput ? 'secondary' : 'default'
                                }
                                className="mb-4"
                            >
                                {listeningForInput
                                    ? 'Press any button...'
                                    : 'Add Button Mapping'}
                            </Button>

                            <div className="space-y-4">
                                {Object.entries(
                                    editedProfile.buttonMappings,
                                ).map(([buttonIndex, action]) => (
                                    <Card key={buttonIndex}>
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-medium">
                                                    Button {buttonIndex}
                                                </span>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newMappings = {
                                                            ...editedProfile.buttonMappings,
                                                        };
                                                        delete newMappings[
                                                            Number(buttonIndex)
                                                        ];
                                                        setEditedProfile(
                                                            (prev) => ({
                                                                ...prev,
                                                                buttonMappings:
                                                                    newMappings,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Action Type</Label>
                                                    <Select
                                                        value={action.type}
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            const type =
                                                                value as GamepadAction['type'];
                                                            handleButtonActionChange(
                                                                Number(
                                                                    buttonIndex,
                                                                ),
                                                                {
                                                                    ...action,
                                                                    type,
                                                                    axis: type.includes(
                                                                        'JOG',
                                                                    )
                                                                        ? 'X'
                                                                        : undefined,
                                                                    value: type.includes(
                                                                        'OVERRIDE',
                                                                    )
                                                                        ? 100
                                                                        : undefined,
                                                                    command:
                                                                        type ===
                                                                        'CUSTOM_COMMAND'
                                                                            ? ''
                                                                            : undefined,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="JOG_CONTINUOUS">
                                                                Continuous Jog
                                                            </SelectItem>
                                                            <SelectItem value="JOG_INCREMENT">
                                                                Incremental Jog
                                                            </SelectItem>
                                                            <SelectItem value="FEED_OVERRIDE">
                                                                Feed Override
                                                            </SelectItem>
                                                            <SelectItem value="RAPID_OVERRIDE">
                                                                Rapid Override
                                                            </SelectItem>
                                                            <SelectItem value="SPINDLE_OVERRIDE">
                                                                Spindle Override
                                                            </SelectItem>
                                                            <SelectItem value="CUSTOM_COMMAND">
                                                                Custom Command
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {action.type.includes(
                                                    'JOG',
                                                ) && (
                                                    <div className="space-y-2">
                                                        <Label>Axis</Label>
                                                        <Select
                                                            value={action.axis}
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                handleButtonActionChange(
                                                                    Number(
                                                                        buttonIndex,
                                                                    ),
                                                                    {
                                                                        ...action,
                                                                        axis: value as JogAxis,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="X">
                                                                    X Axis
                                                                </SelectItem>
                                                                <SelectItem value="Y">
                                                                    Y Axis
                                                                </SelectItem>
                                                                <SelectItem value="Z">
                                                                    Z Axis
                                                                </SelectItem>
                                                                <SelectItem value="A">
                                                                    A Axis
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {action.type.includes(
                                                    'OVERRIDE',
                                                ) && (
                                                    <div className="space-y-2">
                                                        <Label>Value (%)</Label>
                                                        <Input
                                                            type="number"
                                                            value={action.value}
                                                            onChange={(e) =>
                                                                handleButtonActionChange(
                                                                    Number(
                                                                        buttonIndex,
                                                                    ),
                                                                    {
                                                                        ...action,
                                                                        value: Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    },
                                                                )
                                                            }
                                                            min="0"
                                                            max="200"
                                                        />
                                                    </div>
                                                )}

                                                {action.type ===
                                                    'CUSTOM_COMMAND' && (
                                                    <div className="space-y-2">
                                                        <Label>Command</Label>
                                                        <Input
                                                            value={
                                                                action.command
                                                            }
                                                            onChange={(e) =>
                                                                handleButtonActionChange(
                                                                    Number(
                                                                        buttonIndex,
                                                                    ),
                                                                    {
                                                                        ...action,
                                                                        command:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Axis Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setListeningForInput(true)}
                                variant={
                                    listeningForInput ? 'secondary' : 'default'
                                }
                                className="mb-4"
                            >
                                {listeningForInput
                                    ? 'Move any axis...'
                                    : 'Add Axis Setting'}
                            </Button>

                            <div className="space-y-4">
                                {Object.entries(editedProfile.axisSettings).map(
                                    ([axisIndex, settings]) => (
                                        <Card key={axisIndex}>
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-medium">
                                                        Axis {axisIndex}
                                                    </span>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newSettings =
                                                                {
                                                                    ...editedProfile.axisSettings,
                                                                };
                                                            delete newSettings[
                                                                Number(
                                                                    axisIndex,
                                                                )
                                                            ];
                                                            setEditedProfile(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    axisSettings:
                                                                        newSettings,
                                                                }),
                                                            );
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Invert</Label>
                                                        <Switch
                                                            checked={
                                                                settings.invert
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                handleAxisSettingsChange(
                                                                    Number(
                                                                        axisIndex,
                                                                    ),
                                                                    {
                                                                        ...settings,
                                                                        invert: checked,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>
                                                            Sensitivity
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            value={
                                                                settings.sensitivity
                                                            }
                                                            onChange={(e) =>
                                                                handleAxisSettingsChange(
                                                                    Number(
                                                                        axisIndex,
                                                                    ),
                                                                    {
                                                                        ...settings,
                                                                        sensitivity:
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            min="0.1"
                                                            max="10"
                                                            step="0.1"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Deadzone</Label>
                                                        <Input
                                                            type="number"
                                                            value={
                                                                settings.deadzone
                                                            }
                                                            onChange={(e) =>
                                                                handleAxisSettingsChange(
                                                                    Number(
                                                                        axisIndex,
                                                                    ),
                                                                    {
                                                                        ...settings,
                                                                        deadzone:
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            min="0"
                                                            max="1"
                                                            step="0.05"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Profile</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
