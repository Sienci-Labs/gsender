import { UNITS_EN, WORKSPACE_MODE_T } from "../types";
import { GamepadConfig } from "./gamepad";
import { BasicPosition, Tool } from "./general";
import { MachineProfile } from "./machine_profile";
import { ProbeProfile } from "./widgets/probe";
import { RotarySettings } from "./widgets/rotary";

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