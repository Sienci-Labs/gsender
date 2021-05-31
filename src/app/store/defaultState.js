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
    SPINDLE_MODE
} from '../constants';
import { SPEED_NORMAL, SPEED_PRECISE, SPEED_RAPID } from '../widgets/JogControl/constants';

const AXIS_X = 'x';
const AXIS_Y = 'y';
const AXIS_Z = 'z';
const FORWARD = 1;
const BACKWARD = -1;

const defaultState = {
    session: {
        name: '',
        token: ''
    },
    workspace: {
        units: METRIC_UNITS,
        reverseWidgets: false,
        safeRetractHeight: 0,
        toolChangeOption: 'Ignore',
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
        machineProfile: {
            id: 5,
            company: 'Sienci Labs',
            name: 'LongMill',
            type: '30x30',
            mm: {
                width: 792,
                depth: 845,
                height: 114.3
            },
            in: {
                width: 31.18,
                depth: 33.27,
                height: 4.5
            },
            endstops: false,
            spindle: false,
            coolant: false,
            laser: false,
            limits: {
                xmin: 0,
                ymin: 0,
                zmin: 0,
                xmax: 792,
                ymax: 114.3,
                zmax: 845,
            }
        },
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
            }
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
        recentFiles: []
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
                type: 'Grbl' // Grbl|Marlin|Smoothie|TinyG
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
        gcode: {
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
            touchPlateHeight: 10
        },
        spindle: {
            minimized: false,
            mode: SPINDLE_MODE,
            speed: 1000,
            spindleMax: 2000,
            spindleMin: 0,
            laserTest: {
                power: 100,
                duration: 1000,
            }
        },
        visualizer: {
            minimized: false,
            // 3D View
            liteMode: false,
            disabled: false,
            disabledLite: false,
            projection: 'orthographic', // 'perspective' or 'orthographic'
            cameraMode: 'pan', // 'pan' or 'rotate',
            theme: 'dark',
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
    /**
     * Command Keys Available (default):
     *  Start Job                   ~
     *  Pause Job                   !
     *  Stop Job                    @
     *  Zero All                    $
     *  Go to Zero                  %
     *  Feed Hold                   ^
     *  Cycle Start                 &
     *  Homing                      ctrl + alt + command + h
     *  Unlock                      ctrl + alt + command + u
     *  Reset                       ctrl + alt + command + r
     *  Change Jog Speeds           shift + (+ or -)
     *  Jog X                       shift + (left or right) * arrows *
     *  Jog Y                       shift + (up or down)    * arrows *
     *  Jog Z                       shift + (pageup or pagedown)
     */
    commandKeys: [
        { // Start Job
            id: 0,
            title: 'Start Job',
            keys: '~',
            cmd: 'START_JOB',
            preventDefault: true,
            isActive: true,
        },
        { // Pause Job
            id: 1,
            title: 'Pause Job',
            keys: '!',
            cmd: 'PAUSE_JOB',
            preventDefault: true,
            isActive: true,
        },
        { // Stop Job
            id: 2,
            title: 'Stop Job',
            keys: '@',
            cmd: 'STOP_JOB',
            preventDefault: true,
            isActive: true,
        },
        { // Zero All
            id: 3,
            title: 'Zero All',
            keys: '$',
            cmd: 'ZERO_ALL',
            preventDefault: true,
            isActive: true,
        },
        { // Go to Zero
            id: 4,
            title: 'Go to Zero',
            keys: '%',
            cmd: 'GO_TO_ZERO',
            preventDefault: true,
            isActive: true,
        },
        { // Feed Hold
            id: 5,
            title: 'Feed Hold',
            keys: '^',
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'feedhold'
            },
            preventDefault: true,
            isActive: true,
        },
        { // Cycle Start
            id: 6,
            title: 'Cycle Start',
            keys: '&',
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'cyclestart'
            },
            preventDefault: true,
            isActive: true,
        },
        { // Load File
            id: 7,
            title: 'Load File',
            keys: ['shift', 'enter'].join('+'),
            cmd: 'LOAD_FILE',
            preventDefault: false,
            isActive: true,
        },
        { // Homing
            id: 8,
            title: 'Homing',
            keys: ['ctrl', 'alt', 'command', 'h'].join('+'),
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'homing'
            },
            preventDefault: true,
            isActive: true,
        },
        { // Unlock
            id: 9,
            title: 'Unlock',
            keys: ['ctrl', 'alt', 'command', 'u'].join('+'),
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'unlock'
            },
            preventDefault: true,
            isActive: true,
        },
        { // Reset
            id: 10,
            title: 'Reset',
            keys: ['ctrl', 'alt', 'command', 'r'].join('+'),
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'reset'
            },
            preventDefault: true,
            isActive: true,
        },
        { // Change Jog Speed
            id: 11,
            title: 'Increase Jog Speed',
            keys: '=',
            cmd: 'JOG_SPEED',
            payload: {
                speed: 'increase'
            },
            preventDefault: false,
            isActive: true,
        },
        { // Change Jog Speed
            id: 12,
            title: 'Decrease Jog Speed',
            keys: '-',
            cmd: 'JOG_SPEED',
            payload: {
                speed: 'decrease'
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog X+
            id: 13,
            title: 'Jog: X+',
            keys: 'shift+right',
            cmd: 'JOG',
            payload: {
                axis: AXIS_X,
                direction: FORWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog X-
            id: 14,
            title: 'Jog: X-',
            keys: 'shift+left',
            cmd: 'JOG',
            payload: {
                axis: AXIS_X,
                direction: BACKWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog Y+
            id: 15,
            title: 'Jog: Y+',
            keys: 'shift+up',
            cmd: 'JOG',
            payload: {
                axis: AXIS_Y,
                direction: FORWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog Y-
            id: 16,
            title: 'Jog: Y-',
            keys: 'shift+down',
            cmd: 'JOG',
            payload: {
                axis: AXIS_Y,
                direction: BACKWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog Z+
            id: 17,
            title: 'Jog: Z+',
            keys: 'shift+pageup',
            cmd: 'JOG',
            payload: {
                axis: AXIS_Z,
                direction: FORWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Jog Z-
            id: 18,
            title: 'Jog: Z-',
            keys: 'shift+pagedown',
            cmd: 'JOG',
            payload: {
                axis: AXIS_Z,
                direction: BACKWARD,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Zero X Axis
            id: 19,
            title: 'Zero X Axis',
            keys: ['shift', 'q'].join('+'),
            cmd: 'ZERO_AXIS',
            payload: {
                axis: AXIS_X,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Zero y Axis
            id: 20,
            title: 'Zero Y Axis',
            keys: ['shift', 'w'].join('+'),
            cmd: 'ZERO_AXIS',
            payload: {
                axis: AXIS_Y,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Zero Z Axis
            id: 21,
            title: 'Zero Z Axis',
            keys: ['shift', 'e'].join('+'),
            cmd: 'ZERO_AXIS',
            payload: {
                axis: AXIS_Z,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Go to X Axis
            id: 22,
            title: 'Go to X Axis',
            keys: ['shift', 'r'].join('+'),
            cmd: 'GO_TO_AXIS',
            payload: {
                axis: AXIS_X,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Go to Y Axis
            id: 23,
            title: 'Go to Y Axis',
            keys: ['shift', 't'].join('+'),
            cmd: 'GO_TO_AXIS',
            payload: {
                axis: AXIS_Y,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Go to Z Axis
            id: 24,
            title: 'Go to Z Axis',
            keys: ['shift', 'y'].join('+'),
            cmd: 'GO_TO_AXIS',
            payload: {
                axis: AXIS_Z,
            },
            preventDefault: false,
            isActive: true,
        },
        { // Select Rapid Jog Preset
            id: 25,
            title: 'Select Rapid Jog Preset',
            keys: ['shift', 'z'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_RAPID
            },
            preventDefault: false,
            isActive: true,
        },
        { // Select Normal Jog Preset
            id: 26,
            title: 'Select Normal Jog Preset',
            keys: ['shift', 'x'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_NORMAL
            },
            preventDefault: false,
            isActive: true,
        },
        { // Select Precise Jog Preset
            id: 27,
            title: 'Select Precise Jog Preset',
            keys: ['shift', 'c'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_PRECISE
            },
            preventDefault: false,
            isActive: true,
        },
    ]
};

export default defaultState;
