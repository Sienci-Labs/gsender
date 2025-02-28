import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from 'app/store/redux';
import { registerGamepadButton } from 'app/store/redux/slices/gamepadSlice';

import { actionRegistry } from './utils/actionRegistry';

export type GamepadButtonOptions = {
    id: string;
    title: string;
    description?: string;
    buttonIndex: number;
    onPress?: () => void;
    onPressHold?: () => void;
    onRelease?: () => void;
    onReleaseHold?: () => void;
    preventDefault?: boolean;
};

export function useRegisterGamepadButton({
    id,
    title,
    description,
    buttonIndex,
    onPress,
    onPressHold,
    onRelease,
    onReleaseHold,
    preventDefault = true,
}: GamepadButtonOptions) {
    const dispatch = useDispatch();
    const button = useSelector((state: RootState) => state.gamepad.buttons[id]);

    useEffect(() => {
        // Register the button in Redux store
        dispatch(
            registerGamepadButton({
                id,
                title,
                description,
                buttonIndex,
                isActive: true,
                preventDefault,
            }),
        );

        // Register the actions in the action registry
        actionRegistry.register(id, {
            onPress,
            onPressHold,
            onRelease,
            onReleaseHold,
        });

        return () => {
            actionRegistry.unregister(id);
        };
    }, [
        id,
        title,
        description,
        buttonIndex,
        onPress,
        onPressHold,
        onRelease,
        onReleaseHold,
        dispatch,
        preventDefault,
    ]);

    return button;
}
