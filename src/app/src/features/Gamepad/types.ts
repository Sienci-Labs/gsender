export type GamepadAxis = {
    index: number;
    value: number;
    deadzone: number;
};

export type GamepadButton = {
    index: number;
    pressed: boolean;
    value: number;
};

export type RegisteredGamepadButton = {
    id: string;
    title: string;
    description?: string;
    buttonIndex: number;
    isActive: boolean;
    preventDefault: boolean;
    actions: GamepadAction[];
};

export type GamepadProfile = {
    id: string;
    name: string;
    gamepadId: string;
    buttonMappings: Record<number, GamepadAction>;
    axisSettings: Record<number, AxisSetting>;
    deadzone: number;
};

export type AxisSetting = {
    axis: JogAxis;
    invert: boolean;
};

export type JogAxis = 'X' | 'Y' | 'Z' | 'A';

export type GamepadAction = {
    type:
        | 'JOG_CONTINUOUS'
        | 'JOG_INCREMENT'
        | 'FEED_OVERRIDE'
        | 'RAPID_OVERRIDE'
        | 'SPINDLE_OVERRIDE'
        | 'CUSTOM_COMMAND';
    axis?: JogAxis;
    value?: number;
    command?: string;
    description: string;
};

export type GamepadState = {
    connected: boolean;
    id: string;
    buttons: GamepadButton[];
    axes: GamepadAxis[];
    timestamp: number;
};

export type GamepadManagerState = {
    activeProfile: string | null;
    buttons: Record<string, RegisteredGamepadButton>;
    profiles: GamepadProfile[];
    connectedGamepads: Record<string, GamepadState>;
    jogSpeed: number;
    jogMode: 'continuous' | 'incremental';
    jogIncrement: number;
    isEditing: boolean;
};
