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
    IMPERIAL_STEPS,
    METRIC_STEPS,
    METRIC_UNITS,
    SPINDLE_MODE,
    SPIRAL_MOVEMENT,
    START_POSITION_BACK_LEFT,
    SPINDLE_MODES,
} from 'app/constants';
import machineProfiles from 'app/containers/Firmware/components/defaultMachineProfiles';

import { profiles } from './gamepad';

const [M3] = SPINDLE_MODES;

const defaultState = {
    session: {
        name: '',
        token: ''
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
        toolChangeOption: 'Ignore',
        toolChangePosition: {
            x: 0,
            y: 0,
            z: 0
        },
        toolChangeHooks: {
            preHook: '',
            postHook: ''
        },
        container: {
            primary: {
                show: true,
                widgets: [
                    'location', 'axes', 'secondary'
                ]
            }
        },
        machineProfile: machineProfiles[0],
        probeProfile: {
            xyThickness: {
                mm: 10,
                in: 0.393
            },
            zThickness: {
                mm: 15,
                in: 0.590
            },
            plateWidth: {
                mm: 50,
                in: 1.968
            },
            plateLength: {
                mm: 50,
                in: 1.968
            },
            functions: {
                x: true,
                y: true,
                z: true
            },
            touchplateType: 'Standard Block'
        },
        tools: [
            {
                metricDiameter: 6.35,
                imperialDiameter: 0.25,
                type: 'end mill'
            },
            {
                metricDiameter: 3.175,
                imperialDiameter: 0.125,
                type: 'end mill'
            },
            {
                metricDiameter: 9.525,
                imperialDiameter: 0.375,
                type: 'end mill'
            },
            {
                metricDiameter: 12.7,
                imperialDiameter: 0.5,
                type: 'end mill'
            },
            {
                metricDiameter: 15.875,
                imperialDiameter: 0.625,
                type: 'end mill'
            }
        ],
        recentFiles: [],
        gamepad: {
            deadZone: 0.5,
            precision: 3,
            profiles,
        },
        terminal: {
            inputHistory: [],
        }
    },
    widgets: {
        axes: {
            minimized: false,
            axes: ['x', 'y', 'z'],
            jog: {
                xyStep: 5,
                zStep: 2,
                feedrate: 3000,
                keypad: false,
                rapid: {
                    mm: {
                        xyStep: 20,
                        zStep: 10,
                        feedrate: 5000,
                    },
                    in: {
                        xyStep: 1,
                        zStep: 0.5,
                        feedrate: 196.85,
                    }
                },
                normal: {
                    mm: {
                        xyStep: 5,
                        zStep: 2,
                        feedrate: 3000,
                    },
                    in: {
                        xyStep: 0.2,
                        zStep: 0.04,
                        feedrate: 118.11,
                    },
                },
                precise: {
                    mm: {
                        xyStep: 0.5,
                        zStep: 0.1,
                        feedrate: 1000,
                    },
                    in: {
                        xyStep: 0.02,
                        zStep: 0.004,
                        feedrate: 39.37,
                    },
                },
                imperial: {
                    step: IMPERIAL_STEPS.indexOf(1), // Defaults to 1 inch
                    distances: []
                },
                metric: {
                    step: METRIC_STEPS.indexOf(1), // Defaults to 1 mm
                    distances: []
                }
            },
            mdi: {
                disabled: false
            },
            shuttle: {
                feedrateMin: 500,
                feedrateMax: 2000,
                hertz: 10,
                overshoot: 1
            },
        },
        connection: {
            minimized: false,
            controller: {
                type: 'Grbl' // Grbl
            },
            port: '', // will be deprecated in v2
            baudrate: 115200, // will be deprecated in v2
            connection: {
                type: 'serial',
                serial: {
                    // Hardware flow control (RTS/CTS)
                    rtscts: false
                }
            },
            autoReconnect: false
        },
        console: {
            minimized: false
        },
        job_status: {
            minimized: false,
            feedrateMin: 500,
            feedrateMax: 2000,
            spindleSpeedMin: 0,
            spindleSpeedMax: 1000
        },
        grbl: {
            minimized: false,
            panel: {
                queueReports: {
                    expanded: true
                },
                statusReports: {
                    expanded: true
                },
                modalGroups: {
                    expanded: true
                }
            }
        },
        location: {
            minimized: false,
            axes: ['x', 'y', 'z'],
            jog: {
                keypad: true,
                imperial: {
                    step: IMPERIAL_STEPS.indexOf(1), // Defaults to 1 inch
                    distances: []
                },
                metric: {
                    step: METRIC_STEPS.indexOf(1), // Defaults to 1 mm
                    distances: []
                },
                speeds: {
                    xyStep: 5,
                    zStep: 0.5,
                    feedrate: 5000,
                }
            },
            mdi: {
                disabled: false
            },
            shuttle: {
                feedrateMin: 500,
                feedrateMax: 2000,
                hertz: 10,
                overshoot: 1
            }
        },
        macro: {
            minimized: false
        },
        probe: {
            minimized: false,
            probeCommand: 'G38.2',
            connectivityTest: true,
            useTLO: false,
            probeDepth: 10,
            probeFeedrate: {
                mm: 75,
                in: 2.95
            },
            probeFastFeedrate: {
                mm: 150,
                in: 5.9
            },
            retractionDistance: {
                mm: 4,
                in: 0.15
            },
            zProbeDistance: {
                mm: 30,
                in: 1.5
            },
            touchPlateHeight: 10,
            probeType: 'Auto',
        },
        spindle: {
            minimized: false,
            mode: SPINDLE_MODE,
            speed: 1000,
            spindleMax: 30000,
            spindleMin: 10000,
            delay: false,
            laser: {
                power: 100,
                duration: 1,
                xOffset: 0,
                yOffset: 0,
                minPower: 0,
                maxPower: 255
            }
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
            gcode: {
                displayName: true
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
                    visibleLite: false
                },
                cuttingToolAnimation: {
                    visible: true,
                    visibleLite: false
                },
                cutPath: {
                    visible: true,
                    visibleLite: true
                }
            },
            showWarning: false,
            showLineWarnings: false,
        }
    },
    commandKeys: {}
};

export default defaultState;
