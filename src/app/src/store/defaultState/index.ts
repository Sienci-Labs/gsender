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
} from 'app/constants';

import machineProfiles from './machineProfiles';
import { profiles } from './gamepad';

const [M3] = SPINDLE_MODES;

interface Tool {
    metricDiameter: number;
    imperialDiameter: number;
    type: string;
}

interface DefaultState {
    session: {
        name: string;
        token: string;
    };
    workspace: {
        units: string;
        reverseWidgets: boolean;
        safeRetractHeight: number;
        customDecimalPlaces: number;
        jobsFinished: number;
        jobsCancelled: number;
        timeSpentRunning: number;
        longestTimeRun: number;
        jobTimes: any[];
        toolChange: {
            passthrough: boolean;
        };
        toolChangeOption: string;
        toolChangePosition: {
            x: number;
            y: number;
            z: number;
        };
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
        machineProfile: any;
        probeProfile: {
            xyThickness: number;
            zThickness: number;
            plateWidth: number;
            plateLength: number;
            functions: {
                x: boolean;
                y: boolean;
                z: boolean;
            };
            touchplateType: string;
        };
        tools: Tool[];
        recentFiles: any[];
        gamepad: {
            deadZone: number;
            precision: number;
            profiles: any;
        };
        terminal: {
            inputHistory: any[];
        };
        mode: string;
        rotaryAxis: {
            firmwareSettings: any;
            defaultFirmwareSettings: any;
        };
        shouldWarnZero: boolean;
        diagnostics: {
            stepperMotor: {
                storedValue: any;
            };
        };
    };
    widgets: {
        axes: {
            minimized: boolean;
            axes: string[];
            jog: {
                xyStep: number;
                zStep: number;
                aStep: number;
                feedrate: number;
                keypad: boolean;
                rapid: {
                    xyStep: number;
                    zStep: number;
                    aStep: number;
                    xaStep: number;
                    feedrate: number;
                };
                normal: {
                    xyStep: number;
                    zStep: number;
                    aStep: number;
                    xaStep: number;
                    feedrate: number;
                };
                precise: {
                    xyStep: number;
                    zStep: number;
                    aStep: number;
                    xaStep: number;
                    feedrate: number;
                };
                step: number;
                distances: any[];
            };
            mdi: {
                disabled: boolean;
            };
            shuttle: {
                feedrateMin: number;
                feedrateMax: number;
                hertz: number;
                overshoot: number;
            };
        };
        connection: {
            minimized: boolean;
            controller: {
                type: string;
            };
            port: string;
            baudrate: number;
            connection: {
                type: string;
                serial: {
                    rtscts: boolean;
                };
            };
            autoReconnect: boolean;
            ip: number[];
        };
        console: {
            minimized: boolean;
        };
        job_status: {
            minimized: boolean;
            speed: string;
            lastFile: string;
            lastFileSize: string;
            lastFileRunLength: string;
        };
        grbl: {
            minimized: boolean;
            panel: {
                queueReports: {
                    expanded: boolean;
                };
                statusReports: {
                    expanded: boolean;
                };
                modalGroups: {
                    expanded: boolean;
                };
            };
        };
        location: {
            minimized: boolean;
            axes: string[];
            jog: {
                keypad: boolean;
                step: number;
                distances: any[];
                speeds: {
                    xyStep: number;
                    zStep: number;
                    feedrate: number;
                };
            };
            mdi: {
                disabled: boolean;
            };
            shuttle: {
                feedrateMin: number;
                feedrateMax: number;
                hertz: number;
                overshoot: number;
            };
        };
        macro: {
            minimized: boolean;
        };
        probe: {
            minimized: boolean;
            probeCommand: string;
            connectivityTest: boolean;
            useTLO: boolean;
            probeDepth: number;
            probeFeedrate: number;
            probeFastFeedrate: number;
            retractionDistance: number;
            zProbeDistance: number;
            touchPlateHeight: number;
            probeType: string;
            direction: number;
            probeAxis: string;
        };
        rotary: {
            stockTurning: {
                options: {
                    stockLength: number;
                    stepdown: number;
                    bitDiameter: number;
                    spindleRPM: number;
                    feedrate: number;
                    stepover: number;
                    startHeight: number;
                    finalHeight: number;
                    enableRehoming: boolean;
                };
            };
            tab: {
                show: boolean;
            };
        };
        spindle: {
            minimized: boolean;
            mode: string;
            speed: number;
            spindleMax: number;
            spindleMin: number;
            delay: number;
            laser: {
                power: number;
                duration: number;
                xOffset: number;
                yOffset: number;
                minPower: number;
                maxPower: number;
            };
        };
        surfacing: {
            bitDiameter: number;
            stepover: number;
            feedrate: number;
            length: number;
            width: number;
            skimDepth: number;
            maxDepth: number;
            spindleRPM: number;
            type: string;
            startPosition: string;
            spindle: string;
            cutDirectionFlipped: boolean;
            shouldDwell: boolean;
        };
        visualizer: {
            minimized: boolean;
            liteMode: boolean;
            disabled: boolean;
            disabledLite: boolean;
            minimizeRenders: boolean;
            projection: string;
            cameraMode: string;
            theme: string;
            SVGEnabled: boolean;
            jobEndModal: boolean;
            gcode: {
                displayName: boolean;
            };
            objects: {
                limits: {
                    visible: boolean;
                };
                coordinateSystem: {
                    visible: boolean;
                };
                gridLineNumbers: {
                    visible: boolean;
                };
                cuttingTool: {
                    visible: boolean;
                    visibleLite: boolean;
                };
                cuttingToolAnimation: {
                    visible: boolean;
                    visibleLite: boolean;
                };
                cutPath: {
                    visible: boolean;
                    visibleLite: boolean;
                };
            };
            showWarning: boolean;
            showLineWarnings: boolean;
            showSoftLimitWarning: boolean;
        };
    };
    commandKeys: Record<string, any>;
}

const defaultState: DefaultState = {
    session: {
        name: '',
        token: '',
    },
    workspace: {
        units: METRIC_UNITS,
        reverseWidgets: false,
        safeRetractHeight: 0,
        customDecimalPlaces: 0,
        jobsFinished: 0,
        jobsCancelled: 0,
        timeSpentRunning: 0,
        longestTimeRun: 0,
        jobTimes: [],
        toolChange: {
            passthrough: false,
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
        machineProfile: machineProfiles[0],
        probeProfile: {
            xyThickness: 10,
            zThickness: 15,
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
        },
        shouldWarnZero: false,
        diagnostics: {
            stepperMotor: {
                storedValue: null,
            },
        },
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
            retractionDistance: 4,
            zProbeDistance: 30,
            touchPlateHeight: 10,
            probeType: 'Auto',
            direction: 0,
            probeAxis: 'Z',
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
            length: 0,
            width: 0,
            skimDepth: 1,
            maxDepth: 1,
            spindleRPM: 17000,
            type: SPIRAL_MOVEMENT,
            startPosition: START_POSITION_BACK_LEFT,
            spindle: M3,
            cutDirectionFlipped: false,
            shouldDwell: false,
        },
        visualizer: {
            minimized: false,
            // 3D View
            liteMode: false,
            disabled: false,
            disabledLite: false,
            minimizeRenders: false,
            projection: 'orthographic', // 'perspective' or 'orthographic'
            cameraMode: 'pan', // 'pan' or 'rotate',
            theme: 'Dark',
            SVGEnabled: false,
            jobEndModal: true,
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