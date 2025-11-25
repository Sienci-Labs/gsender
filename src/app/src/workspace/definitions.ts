import { WORKSPACE_MODE } from '../constants';
import { MachineProfile } from 'app/definitions/firmware';
import { UNITS_EN, BasicPosition } from 'app/definitions/general';
import { ProbeProfile } from 'app/features/Probe/definitions';
import { RotarySettings } from 'app/features/Rotary/definitions';
import { Tool } from 'app/features/Tools/definitions';
import { GamepadConfig } from 'app/lib/gamepad/definitions';

// Types

export type WORKSPACE_MODE_T =
    (typeof WORKSPACE_MODE)[keyof typeof WORKSPACE_MODE];

export type Notification = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    status: 'read' | 'unread';
    timestamp: Date | string;
};

// Interfaces

export interface Workspace {
    units: UNITS_EN;
    reverseWidgets: boolean;
    spindleFunctions: boolean;
    coolantFunctions: boolean;
    atcEnabled: boolean;
    sendUsageData: boolean;
    safeRetractHeight: number;
    customDecimalPlaces: number;
    jobsFinished: number;
    jobsCancelled: number;
    timeSpentRunning: number;
    longestTimeRun: number;
    defaultFirmware: string;
    outlineMode: string;
    revertWorkspace: boolean;
    park: object;
    jobTimes: number[];
    toolChange: {
        passthrough: boolean;
        skipDialog: boolean;
    };
    toolChangeOption:
    | 'Ignore'
    | 'Pause'
    | 'Standard Re-zero'
    | 'Flexible Re-zero'
    | 'Fixed Tool Sensor'
    | 'Code';
    toolChangePosition: BasicPosition;
    toolChangeHooks: {
        preHook: string;
        postHook: string;
    };
    container: {
        primary: {
            show: boolean;
            widgets: string[];
        };
        default: {
            widgets: string[];
        };
    };
    machineProfile: MachineProfile;
    probeProfile: ProbeProfile;
    tools: Tool[];
    recentFiles: string[];
    gamepad: GamepadConfig;
    terminal: {
        inputHistory: string[];
    };
    mode: WORKSPACE_MODE_T;
    rotaryAxis: {
        firmwareSettings: RotarySettings;
        defaultFirmwareSettings: RotarySettings;
        forceHardLimits: boolean;
        forceSoftLimits: boolean;
    };
    shouldWarnZero: boolean;
    diagnostics: {
        stepperMotor: {
            storedValue: number;
        };
    };
    notifications: Notification[];
    toastDuration: number;
    enableDarkMode: boolean;
}
