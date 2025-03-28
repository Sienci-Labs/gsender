export type GamepadAction = {
    name: string;
    description: string;
    shortcut: string;
};

export type GamepadButton = {
    index: number;
    label: string;
    actions: GamepadAction[];
    isActive?: boolean;
};

export type Axis = 'X' | 'Y' | 'Z' | 'A';

export type GamepadAxis = {
    index: number;
    axis: Axis;
    invertFactor: 1 | -1;
};

export type GamepadProfile = {
    id: string;
    gamepadId: string;
    name: string;
    deadzone: number;
    movementDistanceIncrement: number;
    buttons: GamepadButton[];
    axes: GamepadAxis[];
    lockoutButton?: GamepadButton['index'];
    alternateActionButton?: GamepadButton['index'];
};

export type GamepadState = {
    profiles: GamepadProfile[];
    connectedGamepads: Gamepad[];
    status: 'active' | 'hold';
};
