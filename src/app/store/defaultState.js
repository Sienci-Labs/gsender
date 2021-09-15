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
    CARVING_CATEGORY,
    OVERRIDES_CATEGORY,
    VISUALIZER_CATEGORY,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    PROBING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    GENERAL_CATEGORY,
    TOOLBAR_CATEGORY,
} from 'app/constants';
import {
    MODAL_PREFERENCES,
    MODAL_FIRMWARE,
    MODAL_SURFACING,
    MODAL_CALIBRATE
} from 'app/containers/NavSidebar/constants';
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
        recentFiles: [],
        gamepad: {
            deadZone: 0.5,
            precision: 3,
            profiles: [],
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
            laser: {
                power: 100,
                duration: 1,
            }
        },
        surfacing: {
            defaultMetricState: {
                bitDiameter: 22,
                stepover: 40,
                feedrate: 1500,
                length: 0,
                width: 0,
                skimDepth: 1,
                maxDepth: 1,
                spindleRPM: 17000,
            },
            defaultImperialState: {
                bitDiameter: 1,
                stepover: 40,
                feedrate: 1500,
                length: 0,
                width: 0,
                skimDepth: 0.04,
                maxDepth: 0.04,
            },
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
        { // Load File
            id: 0,
            title: 'Load File',
            keys: ['shift', 'l'].join('+'),
            cmd: 'LOAD_FILE',
            preventDefault: false,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Unload Load File
            id: 1,
            title: 'Unload File',
            keys: ['shift', 'k'].join('+'),
            cmd: 'UNLOAD_FILE',
            preventDefault: false,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Test Run
            id: 2,
            title: 'Test Run',
            keys: '#',
            cmd: 'TEST_RUN',
            preventDefault: false,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Start Job
            id: 3,
            title: 'Start Job',
            keys: '~',
            cmd: 'START_JOB',
            preventDefault: true,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Pause Job
            id: 4,
            title: 'Pause Job',
            keys: '!',
            cmd: 'PAUSE_JOB',
            preventDefault: true,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Stop Job
            id: 5,
            title: 'Stop Job',
            keys: '@',
            cmd: 'STOP_JOB',
            preventDefault: true,
            isActive: true,
            category: CARVING_CATEGORY,
        },
        { // Feed +
            id: 6,
            title: 'Feed +',
            keys: '',
            cmd: 'FEEDRATE_OVERRIDE',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Feed ++
            id: 7,
            title: 'Feed ++',
            keys: '',
            cmd: 'FEEDRATE_OVERRIDE',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Feed -
            id: 8,
            title: 'Feed -',
            keys: '',
            cmd: 'FEEDRATE_OVERRIDE',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Feed --
            id: 9,
            title: 'Feed --',
            keys: '',
            cmd: 'FEEDRATE_OVERRIDE',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Feed Reset
            id: 10,
            title: 'Feed Reset',
            keys: '',
            cmd: 'FEEDRATE_OVERRIDE',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Spindle/Laser +
            id: 11,
            title: 'Spindle/Laser +',
            keys: '',
            cmd: 'SPINDLE_OVERRIDE',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Spindle/Laser ++
            id: 12,
            title: 'Spindle/Laser ++',
            keys: '',
            cmd: 'SPINDLE_OVERRIDE',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Spindle/Laser -
            id: 13,
            title: 'Spindle/Laser -',
            keys: '',
            cmd: 'SPINDLE_OVERRIDE',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Spindle/Laser --
            id: 14,
            title: 'Spindle/Laser --',
            keys: '',
            cmd: 'SPINDLE_OVERRIDE',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // Spindle/Laser Reset
            id: 15,
            title: 'Spindle/Laser Reset',
            keys: '',
            cmd: 'SPINDLE_OVERRIDE',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
        },
        { // 3D / Isometric
            id: 16,
            title: '3D / Isometirc',
            keys: '',
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'isometirc' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // TOP
            id: 17,
            title: 'Top',
            keys: '',
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'top' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // FRONT
            id: 18,
            title: 'Front',
            keys: '',
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'front' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // RIGHT
            id: 19,
            title: 'Right',
            keys: '',
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'right' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // LEFT
            id: 20,
            title: 'Left',
            keys: '',
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'left' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // Reset View
            id: 21,
            title: 'Reset View',
            keys: ['shift', 'n'].join('+'),
            cmd: 'VISUALIZER_VIEW',
            payload: { type: 'default' },
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // Lightweight Mode
            id: 22,
            title: 'Lightweight Mode',
            keys: ['shift', 'm'].join('+'),
            cmd: 'LIGHTWEIGHT_MODE',
            preventDefault: true,
            isActive: true,
            category: VISUALIZER_CATEGORY,
        },
        { // ZERO X AXIS
            id: 23,
            title: 'Zero X Axis',
            keys: ['shift', 'w'].join('+'),
            cmd: 'ZERO_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_X },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // ZERO Y AXIS
            id: 24,
            title: 'Zero Y Axis',
            keys: ['shift', 'e'].join('+'),
            cmd: 'ZERO_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Y },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // ZERO Y AXIS
            id: 25,
            title: 'Zero Z Axis',
            keys: ['shift', 'r'].join('+'),
            cmd: 'ZERO_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Z },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Zero All Axis
            id: 26,
            title: 'Zero All',
            keys: ['shift', 'q'].join('+'),
            cmd: 'ZERO_AXIS',
            payload: { axis: 'all' },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Go to X Zero
            id: 27,
            title: 'Go to X Zero',
            keys: ['shift', 's'].join('+'),
            cmd: 'GO_TO_AXIS_ZERO',
            preventDefault: true,
            payload: { axis: AXIS_X },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Go to Y Zero
            id: 28,
            title: 'Go to Y Zero',
            keys: ['shift', 'd'].join('+'),
            cmd: 'GO_TO_AXIS_ZERO',
            preventDefault: true,
            payload: { axis: AXIS_Y },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Go to Z Zero
            id: 29,
            title: 'Go to Z Zero',
            keys: ['shift', 'f'].join('+'),
            cmd: 'GO_TO_AXIS_ZERO',
            preventDefault: true,
            payload: { axis: AXIS_Z },
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Go to All Zero
            id: 30,
            title: 'Go to All Zero',
            keys: ['shift', 'a'].join('+'),
            cmd: 'GO_TO_AXIS_ZERO',
            payload: { axis: 'all' },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
        },
        { // Homing
            id: 31,
            title: 'Homing',
            keys: ['ctrl', 'alt', 'command', 'h'].join('+'),
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'homing'
            },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
        },


        { // Jog X+
            id: 32,
            title: 'Jog: X+',
            keys: 'shift+right',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X],
                direction: [FORWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog X-
            id: 33,
            title: 'Jog: X-',
            keys: 'shift+left',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X],
                direction: [BACKWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog Y+
            id: 34,
            title: 'Jog: Y+',
            keys: 'shift+up',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_Y],
                direction: [FORWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog Y-
            id: 35,
            title: 'Jog: Y-',
            keys: 'shift+down',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_Y],
                direction: [BACKWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog Z+
            id: 36,
            title: 'Jog: Z+',
            keys: 'shift+pageup',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_Z],
                direction: [FORWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog Z-
            id: 37,
            title: 'Jog: Z-',
            keys: 'shift+pagedown',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_Z],
                direction: [BACKWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog X+ Y-
            id: 38,
            title: 'Jog: X+ Y-',
            keys: '',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X, AXIS_Y],
                direction: [FORWARD, BACKWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog X- Y+
            id: 39,
            title: 'Jog: X- Y+',
            keys: '',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X, AXIS_Y],
                direction: [BACKWARD, FORWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog X+ Y+
            id: 40,
            title: 'Jog: X+ Y+',
            keys: '',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X, AXIS_Y],
                direction: [FORWARD, FORWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Jog X- Y-
            id: 41,
            title: 'Jog: X- Y-',
            keys: '',
            cmd: 'JOG',
            payload: {
                axis: [AXIS_X, AXIS_Y],
                direction: [BACKWARD, BACKWARD],
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Stop Jog
            id: 42,
            title: 'Stop Jog',
            keys: '',
            cmd: 'STOP_JOG',
            payload: { force: true },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Change Jog Speed
            id: 43,
            title: 'Increase Jog Speed',
            keys: '=',
            cmd: 'JOG_SPEED',
            payload: {
                speed: 'increase'
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Change Jog Speed
            id: 44,
            title: 'Decrease Jog Speed',
            keys: '-',
            cmd: 'JOG_SPEED',
            payload: {
                speed: 'decrease'
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Select Rapid Jog Preset
            id: 45,
            title: 'Select Rapid Jog Preset',
            keys: ['shift', 'v'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_RAPID
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Select Normal Jog Preset
            id: 46,
            title: 'Select Normal Jog Preset',
            keys: ['shift', 'c'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_NORMAL
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Select Precise Jog Preset
            id: 47,
            title: 'Select Precise Jog Preset',
            keys: ['shift', 'x'].join('+'),
            cmd: 'SET_JOG_PRESET',
            payload: {
                key: SPEED_PRECISE
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },
        { // Cycle Through Jog Presets
            id: 48,
            title: 'Cycle Through Jog Presets',
            keys: ['shift', 'z'].join('+'),
            cmd: 'CYCLE_JOG_PRESETS',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
        },


        { // Confirm Probe                               TODO
            id: 49,
            title: 'Confirm Probe',
            keys: '',
            cmd: 'CONFIRM_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
        },
        { // Start Probing                               TODO
            id: 50,
            title: 'Start Probing',
            keys: '',
            cmd: 'START_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
        },


        { // Toggle Mode
            id: 51,
            title: 'Toggle Mode',
            keys: '',
            cmd: 'TOGGLE_SPINDLE_LASER_MODE',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
        },
        { // CW / Laser On
            id: 52,
            title: 'CW / Laser On',
            keys: '',
            cmd: 'CW_LASER_ON',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
        },
        { // CCW / Laser Test
            id: 53,
            title: 'CCW / Laser Test',
            keys: '',
            cmd: 'CCW_LASER_TEST',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
        },
        { // Stop / Laser Off
            id: 54,
            title: 'Stop / Laser Off',
            keys: '',
            cmd: 'STOP_LASER_OFF',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
        },


        { // Cut
            id: 55,
            title: 'Cut',
            keys: ['ctrl', 'x'].join('+'),
            cmd: 'CUT',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Copy
            id: 56,
            title: 'Copy',
            keys: ['ctrl', 'c'].join('+'),
            cmd: 'COPY',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Paste
            id: 57,
            title: 'Paste',
            keys: ['ctrl', 'v'].join('+'),
            cmd: 'PASTE',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Undo
            id: 58,
            title: 'Undo',
            keys: ['ctrl', 'z'].join('+'),
            cmd: 'UNDO',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Close Dialog                                TODO
            id: 59,
            title: 'Close Dialog',
            keys: 'esc',
            cmd: 'CLOSE_DIALOG',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Toggle Tab Widgets                          TODO
            id: 60,
            title: 'Toggle Tab Widgets',
            keys: 'tab',
            cmd: 'TOGGLE_TAB_WIDGETS',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Unlock
            id: 61,
            title: 'Unlock',
            keys: '$',
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'unlock'
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Soft Reset
            id: 62,
            title: 'Soft Reset',
            keys: '%',
            cmd: 'CONTROLLER_COMMAND',
            payload: {
                command: 'reset'
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
        },
        { // Toggle Shortcuts
            id: 63,
            title: 'Toggle Shortcuts',
            keys: '^',
            cmd: 'TOGGLE_SHORTCUTS',
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
        },

        { // Connect
            id: 64,
            title: 'Connect',
            keys: 'f1',
            cmd: 'OPEN_TOOLBAR',
            payload: { shouldConnect: true },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Surfacing
            id: 65,
            title: 'Surfacing',
            keys: 'f2',
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: MODAL_SURFACING },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Heightmap
            id: 66,
            title: 'Heightmap',
            keys: 'f3',
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: null },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Calibrate
            id: 67,
            title: 'Calibrate',
            keys: 'f4',
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: MODAL_CALIBRATE },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Firmware
            id: 68,
            title: 'Firmware',
            keys: 'f5',
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: MODAL_FIRMWARE },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Help
            id: 69,
            title: 'Help',
            keys: 'f6',
            cmd: 'OPEN_TOOLBAR',
            payload: { shouldOpenHelpPage: true },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
        { // Settings
            id: 70,
            title: 'Settings',
            keys: 'f7',
            cmd: 'OPEN_TOOLBAR',
            payload: { toolbar: MODAL_PREFERENCES },
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
        },
    ]
};

export default defaultState;
