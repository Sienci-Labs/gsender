import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';

import Button from 'app/components/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from 'app/components/shadcn/Dialog';
import { toast } from 'app/lib/toaster';
import { Input } from 'app/components/shadcn/Input';
import { registerProfile } from 'app/store/redux/slices/gamepadSlice';

import { AxisSetting, GamepadAction } from './types';
import { GamepadProfile, GamepadButton, GamepadAxis } from './typesNew';

export const AddNewProfile = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [detectedGamepad, setDetectedGamepad] = useState<Gamepad | null>(
        null,
    );
    const [isListening, setIsListening] = useState(false);
    const [profileName, setProfileName] = useState('');
    const profileNameRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        let frameId: number;

        const checkGamepadInput = () => {
            if (!isListening) return;

            const gamepads = navigator.getGamepads();
            gamepads.forEach((gamepad) => {
                if (!gamepad) return;

                // Check for any button press
                const buttonPressed = gamepad.buttons.some(
                    (button) => button.pressed,
                );
                if (buttonPressed) {
                    setDetectedGamepad(gamepad);
                    setProfileName(`${gamepad.id} Profile`);
                    setIsListening(false);
                }
            });

            frameId = requestAnimationFrame(checkGamepadInput);
        };

        if (isListening) {
            frameId = requestAnimationFrame(checkGamepadInput);
        }

        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [isListening]);

    const handleCreateProfile = () => {
        if (!detectedGamepad) return;

        const buttons: GamepadButton[] = detectedGamepad.buttons.map(
            (_, index) => ({
                index,
                label: index.toString(),
                actions: [],
            }),
        );

        const determineAxes = (): GamepadAxis[] => {
            console.log(detectedGamepad.axes);
            if (detectedGamepad.axes.length === 4) {
                return [
                    { index: 0, axis: 'X', invertFactor: 1 },
                    { index: 1, axis: 'X', invertFactor: 1 },
                    { index: 2, axis: 'Y', invertFactor: 1 },
                    { index: 3, axis: 'Y', invertFactor: 1 },
                ];
            } else if (detectedGamepad.axes.length === 2) {
                return [
                    { index: 0, axis: 'X', invertFactor: 1 },
                    { index: 1, axis: 'X', invertFactor: 1 },
                ];
            } else {
                return [];
            }
        };

        const newProfile: GamepadProfile = {
            id: uuidv4(),
            gamepadId: detectedGamepad.id,
            name: profileName,
            buttons,
            axes: determineAxes(),
            deadzone: 0.1,
            movementDistanceIncrement: 0.1,
        };

        dispatch(registerProfile(newProfile));
        setIsOpen(false);
        setDetectedGamepad(null);
        setProfileName('');

        toast.success('Created new gamepad profile!');
    };

    const handleStartListening = () => {
        setIsListening(true);
        setDetectedGamepad(null);
        setProfileName('');
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} variant="outline">
                Create New Profile
            </Button>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsOpen(false);
                        setDetectedGamepad(null);
                        setIsListening(false);
                        setProfileName('');
                    }
                }}
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Create New Gamepad Profile</DialogTitle>
                        <DialogDescription>
                            Press any button on the gamepad you want to create a
                            profile for.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!detectedGamepad && !isListening && (
                            <Button
                                onClick={handleStartListening}
                                className="w-full"
                            >
                                Start Detecting Gamepad
                            </Button>
                        )}

                        {isListening && (
                            <div className="text-center py-8 text-muted-foreground">
                                Waiting for gamepad input...
                            </div>
                        )}

                        {detectedGamepad && (
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4">
                                    <h4 className="font-bold">
                                        Detected Gamepad:
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {detectedGamepad.id}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {detectedGamepad.buttons.length}{' '}
                                        buttons, {detectedGamepad.axes.length}{' '}
                                        axes
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">
                                            Profile Name
                                        </label>
                                        <Input
                                            value={profileName}
                                            onChange={(e) =>
                                                setProfileName(e.target.value)
                                            }
                                            placeholder="Enter profile name"
                                            className="mt-1 w-full"
                                            ref={profileNameRef}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            onClick={handleStartListening}
                                            variant="ghost"
                                        >
                                            Try Again
                                        </Button>
                                        <Button
                                            onClick={handleCreateProfile}
                                            disabled={!profileName.trim()}
                                        >
                                            Create Profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddNewProfile;
