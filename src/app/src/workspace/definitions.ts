import { WORKSPACE_MODE } from "../constants";
import { MachineProfile } from "app/definitions/firmware";
import { UNITS_EN, BasicPosition } from "app/definitions/general";
import { ProbeProfile } from "app/features/Probe/definitions";
import { RotarySettings } from "app/features/Rotary/definitions";
import { Tool } from "app/features/Tools/definitions";
import { GamepadConfig } from "app/lib/gamepad/definitions";


// Types

export type WORKSPACE_MODE_T =
(typeof WORKSPACE_MODE)[keyof typeof WORKSPACE_MODE];


// Interfaces

export interface Workspace {
    units: UNITS_EN,
    reverseWidgets: boolean,
    safeRetractHeight: number,
    customDecimalPlaces: number,
    jobsFinished: number,
    jobsCancelled: number,
    timeSpentRunning: number,
    longestTimeRun: number,
    jobTimes: number[],
    toolChange: {
        passthrough: boolean,
    },
    toolChangeOption: 'Ignore' | 'Pause' | 'Standard Re-zero' | 'Flexible Re-zero' | 'Fixed Tool Sensor' | 'Code',
    toolChangePosition: BasicPosition,
    toolChangeHooks: {
        preHook: string,
        postHook: string,
    },
    container: {
        primary: {
            show: boolean,
            widgets: string[],
        },
        default: {
            widgets: string[],
        },
    };
    machineProfile: MachineProfile,
    probeProfile: ProbeProfile,
    tools: Tool[],
    recentFiles: string[],
    gamepad: GamepadConfig;
    terminal: {
        inputHistory: string[];
    };
    mode: WORKSPACE_MODE_T;
    rotaryAxis: {
        firmwareSettings: RotarySettings;
        defaultFirmwareSettings: RotarySettings;
    };
    shouldWarnZero: boolean;
    diagnostics: {
        stepperMotor: {
            storedValue: number;
        };
    };
};