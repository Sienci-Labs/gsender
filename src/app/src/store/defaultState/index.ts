/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import {
    METRIC_STEPS,
    METRIC_UNITS,
    SPINDLE_MODE,
    SPIRAL_MOVEMENT,
    START_POSITION_BACK_LEFT,
    SPINDLE_MODES,
    WORKSPACE_MODE,
    ROTARY_MODE_FIRMWARE_SETTINGS,
    DEFAULT_FIRMWARE_SETTINGS,
    LIGHTWEIGHT_OPTIONS,
    GRBLHAL,
    OUTLINE_MODE_DETAILED,
} from '../../constants';

import machineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import { profiles } from './gamepad';
import { State } from '../definitions';
import { MachineProfile } from 'app/definitions/firmware';
import { SPINDLE } from 'app/lib/definitions/gcode_virtualization';

const [M3] = SPINDLE_MODES;

const defaultState: State = {
    session: {
        name: '',
        token: '',
    },
    workspace: {
        units: METRIC_UNITS,
        reverseWidgets: false,
        spindleFunctions: false,
        coolantFunctions: true,
        safeRetractHeight: 0,
        customDecimalPlaces: 0,
        jobsFinished: 0,
        jobsCancelled: 0,
        timeSpentRunning: 0,
        longestTimeRun: 0,
        defaultFirmware: GRBLHAL,
        outlineMode: OUTLINE_MODE_DETAILED,
        revertWorkspace: false,
        sendUsageData: false,
        jobTimes: [],
        toolChange: {
            passthrough: false,
            skipDialog: false,
        },
        toolChangeOption: 'Ignore',
        toolChangePosition: {
            x: 0,
            y: 0,
            z: 0,
        },
        toolChangeHooks: {
            preHook: '',
            postHook: '',
        },
        container: {
            primary: {
                show: true,
                widgets: ['location', 'axes', 'secondary'],
            },
            default: {
                widgets: ['visualizer', 'job_status'],
            },
        },
        machineProfile: machineProfiles[5] as MachineProfile,
        probeProfile: {
            xyThickness: 10,
            zThickness: {
                standardBlock: 15,
                autoZero: 5,
                zProbe: 15,
                probe3D: 0,
                bitZero: 13,
                bitZeroZOnly: 15.5,
            },
            plateWidth: 50,
            plateLength: 50,
            functions: {
                x: true,
                y: true,
                z: true,
            },
            touchplateType: 'Standard Block',
        },
        tools: [
            {
                metricDiameter: 6.35,
                imperialDiameter: 0.25,
                type: 'end mill',
            },
            {
                metricDiameter: 3.175,
                imperialDiameter: 0.125,
                type: 'end mill',
            },
            {
                metricDiameter: 9.525,
                imperialDiameter: 0.375,
                type: 'end mill',
            },
            {
                metricDiameter: 12.7,
                imperialDiameter: 0.5,
                type: 'end mill',
            },
            {
                metricDiameter: 15.875,
                imperialDiameter: 0.625,
                type: 'end mill',
            },
        ],
        recentFiles: [],
        gamepad: {
            deadZone: 0.5,
            precision: 3,
            profiles,
        },
        terminal: {
            inputHistory: [],
        },
        mode: WORKSPACE_MODE.DEFAULT,
        rotaryAxis: {
            firmwareSettings: ROTARY_MODE_FIRMWARE_SETTINGS,
            defaultFirmwareSettings: DEFAULT_FIRMWARE_SETTINGS,
            forceHardLimits: false,
            forceSoftLimits: false,
        },
        shouldWarnZero: false,
        diagnostics: {
            stepperMotor: {
                storedValue: null,
            },
        },
        park: { x: 0, y: 0, z: 0 },
        notifications: [],
        toastDuration: 0,
        enableDarkMode: false,
    },
    widgets: {
        axes: {
            minimized: false,
            axes: ['x', 'y', 'z'],
            jog: {
                xyStep: 5,
                zStep: 2,
                aStep: 5,
                feedrate: 3000,
                keypad: false,
                rapid: {
                    xyStep: 20,
                    zStep: 10,
                    aStep: 20,
                    xaStep: 20,
                    feedrate: 5000,
                },
                normal: {
                    xyStep: 5,
                    zStep: 2,
                    aStep: 5,
                    xaStep: 5,
                    feedrate: 3000,
                },
                precise: {
                    xyStep: 0.5,
                    zStep: 0.1,
                    aStep: 0.5,
                    xaStep: 0.5,
                    feedrate: 1000,
                },
                step: METRIC_STEPS.indexOf(1), // Defaults to 1 mm
                distances: [],
                threshold: 250,
            },
            mdi: {
                disabled: false,
            },
            shuttle: {
                feedrateMin: 500,
                feedrateMax: 2000,
                hertz: 10,
                overshoot: 1,
            },
        },
        connection: {
            minimized: false,
            controller: {
                type: 'Grbl', // Grbl
            },
            port: '', // will be deprecated in v2
            baudrate: 115200, // will be deprecated in v2
            connection: {
                type: 'serial',
                serial: {
                    // Hardware flow control (RTS/CTS)
                    rtscts: false,
                },
            },
            autoReconnect: false,
            ip: [192, 168, 5, 1],
        },
        console: {
            minimized: false,
        },
        job_status: {
            minimized: false,
            speed: '',
            lastFile: '',
            lastFileSize: '',
            lastFileRunLength: '',
        },
        grbl: {
            minimized: false,
            panel: {
                queueReports: {
                    expanded: true,
                },
                statusReports: {
                    expanded: true,
                },
                modalGroups: {
                    expanded: true,
                },
            },
        },
        location: {
            minimized: false,
            axes: ['x', 'y', 'z'],
            jog: {
                keypad: true,
                step: METRIC_STEPS.indexOf(1), // Defaults to 1 mm
                distances: [],
                speeds: {
                    xyStep: 5,
                    zStep: 0.5,
                    feedrate: 5000,
                },
            },
            mdi: {
                disabled: false,
            },
            shuttle: {
                feedrateMin: 500,
                feedrateMax: 2000,
                hertz: 10,
                overshoot: 1,
            },
        },
        macro: {
            minimized: false,
        },
        probe: {
            minimized: false,
            probeCommand: 'G38.2',
            connectivityTest: true,
            useTLO: false,
            probeDepth: 10,
            probeFeedrate: 75,
            probeFastFeedrate: 150,
            retractionDistance: 2,
            zProbeDistance: 30,
            touchPlateHeight: 10,
            probeType: 'Auto',
            direction: 0,
            probeAxis: 'Z',
            tipDiameter3D: 2,
            xyRetract3D: 10,
        },
        rotary: {
            stockTurning: {
                options: {
                    stockLength: 100,
                    stepdown: 20,
                    bitDiameter: 6.35,
                    spindleRPM: 17000,
                    feedrate: 3000,
                    stepover: 15,
                    startHeight: 50,
                    finalHeight: 40,
                    enableRehoming: false,
                    shouldDwell: false,
                },
            },
            tab: {
                show: false,
            },
        },
        spindle: {
            minimized: false,
            mode: SPINDLE_MODE,
            speed: 1000,
            spindleMax: 30000,
            spindleMin: 10000,
            delay: 0,
            laser: {
                laserOnOutline: false,
                power: 100,
                duration: 1,
                xOffset: 0,
                yOffset: 0,
                minPower: 0,
                maxPower: 255,
            },
        },
        surfacing: {
            bitDiameter: 22,
            stepover: 40,
            feedrate: 2500,
            length: 100,
            width: 100,
            skimDepth: 1,
            maxDepth: 1,
            spindleRPM: 17000,
            type: SPIRAL_MOVEMENT,
            startPosition: START_POSITION_BACK_LEFT,
            spindle: M3 as SPINDLE,
            cutDirectionFlipped: false,
            shouldDwell: false,
            flood: false,
            mist: false,
        },
        visualizer: {
            minimized: false,
            // 3D View
            liteMode: false,
            liteOption: LIGHTWEIGHT_OPTIONS.LIGHT,
            disabled: false,
            disabledLite: false,
            minimizeRenders: false,
            projection: 'orthographic', // 'perspective' or 'orthographic'
            cameraMode: 'pan', // 'pan' or 'rotate',
            theme: 'Dark',
            SVGEnabled: false,
            jobEndModal: true,
            maintenanceTaskNotifications: true,
            checkFile: false,
            gcode: {
                displayName: true,
            },
            objects: {
                limits: {
                    visible: true,
                },
                coordinateSystem: {
                    visible: true,
                },
                gridLineNumbers: {
                    visible: true,
                },
                cuttingTool: {
                    visible: true,
                    visibleLite: false,
                },
                cuttingToolAnimation: {
                    visible: true,
                    visibleLite: false,
                },
                cutPath: {
                    visible: true,
                    visibleLite: true,
                },
            },
            showWarning: false,
            showLineWarnings: false,
            showSoftLimitWarning: false,
        },
    },
    commandKeys: {},
};

export default defaultState;
