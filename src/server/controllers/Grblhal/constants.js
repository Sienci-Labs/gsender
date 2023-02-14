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

/* eslint max-len: 0 */
// Grbl
export const GRBLHAL = 'grblHAL';

// Active State
export const GRBL_ACTIVE_STATE_IDLE = 'Idle';
export const GRBL_ACTIVE_STATE_RUN = 'Run';
export const GRBL_ACTIVE_STATE_HOLD = 'Hold';
export const GRBL_ACTIVE_STATE_DOOR = 'Door';
export const GRBL_ACTIVE_STATE_HOME = 'Home';
export const GRBL_ACTIVE_STATE_SLEEP = 'Sleep';
export const GRBL_ACTIVE_STATE_ALARM = 'Alarm';
export const GRBL_ACTIVE_STATE_CHECK = 'Check';

// Real-time Commands: ~, !, ?, and Ctrl-x
export const GRBLHAL_REALTIME_COMMANDS = {
    CYCLE_START: '\x81',
    FEED_HOLD: '\x82',
    STATUS_REPORT: '\x80',
    CMD_RESET: '\x18',
    PARSER_STATE_REPORT: '\x83', // $G equivalent
    COMPLETE_REALTIME_REPORT: '\x87',
    VIRTUAL_STOP_TOGGLE: '\x88',
    TOOL_CHANGE_ACK: '\xA3',
    ERR_CLEAR: 'ErrClear'
};

// https://github.com/grbl/grbl/wiki/Configuring-Grbl-v0.9
// http://linuxcnc.org/docs/html/gcode/overview.html#cap:modal-groups
export const GRBL_MODAL_GROUPS = [
    { // Motion Mode (Defaults to G0)
        group: 'motion',
        modes: ['G0', 'G1', 'G2', 'G3', 'G5', 'G38.2', 'G38.3', 'G38.4', 'G38.5', 'G80']
    },
    { // Work Coordinate System Select (Defaults to G54)
        group: 'wcs',
        modes: ['G54', 'G55', 'G56', 'G57', 'G58', 'G59']
    },
    { // Lathe Mode
        group: 'lathe',
        modes: ['G7', 'G8']
    },
    { // Plane Select (Defaults to G17)
        group: 'plane',
        modes: ['G17', 'G18', 'G19']
    },
    { // Units Mode (Defaults to G21)
        group: 'units',
        modes: ['G20', 'G21']
    },
    { // Distance Mode (Defaults to G90)
        group: 'distance',
        modes: ['G90', 'G91']
    },
    { // Feed Rate Mode (Defaults to G94)
        group: 'feedrate',
        modes: ['G93', 'G94']
    },
    { // Program Mode (Defaults to M0)
        group: 'program',
        modes: ['M0', 'M1', 'M2', 'M30']
    },
    { // Cycle retract
        group: 'cycle',
        modes: ['G98', 'G99']
    },
    { // Spindle State (Defaults to M5)
        group: 'spindle',
        modes: ['M3', 'M4', 'M5']
    },
    { // Coolant State (Defaults to M9)
        group: 'coolant',
        modes: ['M7', 'M8', 'M9']
    }
];

// Errors
// https://github.com/gnea/grbl/blob/master/doc/csv/error_codes_en_US.csv
export const GRBL_ERRORS = [
    {
        code: 1,
        message: 'Expected command letter',
        description: 'G-code words consist of a letter and a value. Letter was not found.'
    },
    {
        code: 2,
        message: 'Bad number format',
        description: 'Missing the expected G-code word value or numeric value format is not valid.'
    },
    {
        code: 3,
        message: 'Invalid statement',
        description: 'Grbl \$\' system command was not recognized or supported.'
    },
    {
        code: 4,
        message: 'Value < 0',
        description: 'Negative value received for an expected positive value.'
    },
    {
        code: 5,
        message: 'Setting disabled',
        description: 'Homing cycle failure. Homing is not enabled via settings.'
    },
    {
        code: 6,
        message: 'Value < 3 usec',
        description: 'Minimum step pulse time must be greater than 3usec.'
    },
    {
        code: 7,
        message: 'EEPROM read fail. Using defaults',
        description: 'An EEPROM read failed. Auto-restoring affected EEPROM to default values.'
    },
    {
        code: 8,
        message: 'Not idle',
        description: 'Grbl \'$\' command cannot be used unless Grbl is IDLE. Ensures smooth operation during a job.'
    },
    {
        code: 9,
        message: 'G-code lock',
        description: 'G-code commands are locked out during alarm or jog state.'
    },
    {
        code: 10,
        message: 'Homing not enabled',
        description: 'Soft limits cannot be enabled without homing also enabled.'
    },
    {
        code: 11,
        message: 'Line overflow',
        description: 'Max characters per line exceeded. Received command line was not executed.'
    },
    {
        code: 12,
        message: 'Step rate > 30kHz',
        description: 'Grbl \'$\' setting value cause the step rate to exceed the maximum supported.'
    },
    {
        code: 13,
        message: 'Check Door',
        description: 'Safety door detected as opened and door state initiated.'
    },
    {
        code: 14,
        message: 'Line length exceeded',
        description: 'Build info or startup line exceeded EEPROM line length limit. Line not stored.'
    },
    {
        code: 15,
        message: 'Travel exceeded',
        description: 'Jog target exceeds machine travel. Jog command has been ignored.'
    },
    {
        code: 16,
        message: 'Invalid jog command',
        description: 'Jog command has no \'=\' or contains prohibited g-code.'
    },
    {
        code: 17,
        message: 'Setting disabled',
        description: 'Laser mode requires PWM output.'
    },
    {
        code: 20,
        message: 'Unsupported command',
        description: 'Unsupported or invalid g-code command found in block.'
    },
    {
        code: 21,
        message: 'Modal group violation',
        description: 'More than one g-code command from same modal group found in block.'
    },
    {
        code: 22,
        message: 'Undefined feed rate',
        description: 'Feed rate has not yet been set or is undefined.'
    },
    {
        code: 23,
        message: 'Invalid gcode ID:23',
        description: 'G-code command in block requires an integer value.'
    },
    {
        code: 24,
        message: 'Invalid gcode ID:24',
        description: 'More than one g-code command that requires axis words found in block.'
    },
    {
        code: 25,
        message: 'Invalid gcode ID:25',
        description: 'Repeated g-code word found in block.'
    },
    {
        code: 26,
        message: 'Invalid gcode ID:26',
        description: 'No axis words found in block for g-code command or current modal state which requires them.'
    },
    {
        code: 27,
        message: 'Invalid gcode ID:27',
        description: 'Line number value is invalid.'
    },
    {
        code: 28,
        message: 'Invalid gcode ID:28',
        description: 'G-code command is missing a required value word.'
    },
    {
        code: 29,
        message: 'Invalid gcode ID:29',
        description: 'G59.x work coordinate systems are not supported.'
    },
    {
        code: 30,
        message: 'Invalid gcode ID:30',
        description: 'G53 only allowed with G0 and G1 motion modes.'
    },
    {
        code: 31,
        message: 'Invalid gcode ID:31',
        description: 'Axis words found in block when no command or current modal state uses them.'
    },
    {
        code: 32,
        message: 'Invalid gcode ID:32',
        description: 'G2 and G3 arcs require at least one in-plane axis word.'
    },
    {
        code: 33,
        message: 'Invalid gcode ID:33',
        description: 'Motion command target is invalid.'
    },
    {
        code: 34,
        message: 'Invalid gcode ID:34',
        description: 'Arc radius value is invalid.'
    },
    {
        code: 35,
        message: 'Invalid gcode ID:35',
        description: 'G2 and G3 arcs require at least one in-plane offset word.'
    },
    {
        code: 36,
        message: 'Invalid gcode ID:36',
        description: 'Unused value words found in block.'
    },
    {
        code: 37,
        message: 'Invalid gcode ID:37',
        description: 'G43.1 dynamic tool length offset is not assigned to configured tool length axis.'
    },
    {
        code: 38,
        message: 'Invalid gcode ID:38',
        description: 'Tool number greater than max supported value.'
    }
];

// Alarms
// https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv
export const GRBL_ALARMS = [
    {
        code: 1,
        message: 'Hard limit',
        description: 'Hard limit has been triggered. Machine position is likely lost due to sudden halt. Re-homing is highly recommended.'
    },
    {
        code: 2,
        message: 'Soft limit',
        description: 'Soft limit alarm. G-code motion target exceeds machine travel. Machine position retained. Alarm may be safely unlocked.'
    },
    {
        code: 3,
        message: 'Abort during cycle',
        description: 'Reset while in motion. Machine position is likely lost due to sudden halt. Re-homing is highly recommended.'
    },
    {
        code: 4,
        message: 'Probe fail',
        description: 'Probe fail. Probe is not in the expected initial state before starting probe cycle when G38.2 and G38.3 is not triggered and G38.4 and G38.5 is triggered.'
    },
    {
        code: 5,
        message: 'Probe fail',
        description: 'Probe fail. Probe did not contact the workpiece within the programmed travel for G38.2 and G38.4.'
    },
    {
        code: 6,
        message: 'Homing fail',
        description: 'Homing fail. The active homing cycle was reset.'
    },
    {
        code: 7,
        message: 'Homing fail',
        description: 'Homing fail. Safety door was opened during homing cycle.'
    },
    {
        code: 8,
        message: 'Homing fail',
        description: 'Homing fail. Pull off travel failed to clear limit switch. Try increasing pull-off setting or check wiring.'
    },
    {
        code: 9,
        message: 'Homing fail',
        description: 'Homing fail. Could not find limit switch within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.'
    },
    {
        code: 'Homing',
        message: 'Homing required',
        description: 'Homing must be run if limit switches and homing cycle is enabled in EEPROM'
    }
];

export const GRBL_SETTINGS_INPUT_TYPES = {
    NUMBER: 'number',
    MASK: 'mask',
    MASK_STATUS_REPORT: 'mask-status-report',
    SWITCH: 'switch',
};

const { NUMBER, MASK, MASK_STATUS_REPORT, SWITCH } = GRBL_SETTINGS_INPUT_TYPES;

// Settings
// https://github.com/gnea/grbl/blob/master/doc/csv/setting_codes_en_US.csv
export const GRBL_SETTINGS = [
    {
        setting: '$0',
        message: 'Step pulse time',
        category: 'Motors',
        units: 'μs',
        description: 'Sets time length per step. Minimum 3usec.',
        inputType: NUMBER,
        min: 3,
        max: 12,
        step: 1
    },
    {
        setting: '$1',
        message: 'Step idle delay',
        category: 'Motors',
        units: 'ms',
        description: 'Sets a short hold delay when stopping to let dynamics settle before disabling steppers. Value 255 keeps motors enabled with no delay.',
        inputType: NUMBER,
        min: 25,
        max: 255,
        step: 5
    },
    {
        setting: '$2',
        message: 'Step pulse invert',
        category: 'Motors',
        units: 'mask',
        description: 'Inverts the step signal. Set axis bit to invert (00000ZYX).',
        inputType: MASK
    },
    {
        setting: '$3',
        message: 'Step direction invert',
        category: 'Motors',
        units: 'mask',
        description: 'Inverts the direction signal. Set axis bit to invert (00000ZYX).',
        inputType: MASK
    },
    {
        setting: '$4',
        message: 'Invert step enable pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the stepper driver enable pin signal.',
        inputType: SWITCH
    },
    {
        setting: '$5',
        message: 'Invert limit pins',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the all of the limit input pins.',
        inputType: SWITCH
    },
    {
        setting: '$6',
        message: 'Invert probe pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the probe input pin signal.',
        inputType: SWITCH
    },
    {
        setting: '$10',
        message: 'Status report options',
        category: 'GRBL',
        units: 'mask',
        description: 'Alters data included in status reports.',
        inputType: MASK_STATUS_REPORT
    },
    {
        setting: '$11',
        message: 'Junction deviation',
        category: 'GRBL',
        units: 'mm',
        description: 'Sets how fast Grbl travels through consecutive motions. Lower value slows it down.',
        inputType: NUMBER,
        min: 0.001,
        max: 0.020,
        step: 0.001
    },
    {
        setting: '$12',
        message: 'Arc tolerance',
        category: 'GRBL',
        units: 'mm',
        description: 'Sets the G2 and G3 arc tracing accuracy based on radial error. Beware: A very small value may effect performance.',
        inputType: NUMBER,
        min: 0.001,
        max: 0.003,
        step: 0.001
    },
    {
        setting: '$13',
        message: 'Report in inches',
        category: 'GRBL',
        units: 'boolean',
        description: 'Enables inch units when returning any position and rate value that is not a settings value.',
        inputType: SWITCH
    },
    {
        setting: '$20',
        message: 'Soft limits enable',
        category: 'Homing',
        units: 'boolean',
        description: 'Enables soft limits checks within machine travel and sets alarm when exceeded. Requires homing.',
        inputType: SWITCH
    },
    {
        setting: '$21',
        message: 'Hard limits enable',
        category: 'Homing',
        units: 'boolean',
        description: 'Enables hard limits. Immediately halts motion and throws an alarm when switch is triggered.',
        inputType: SWITCH
    },
    {
        setting: '$22',
        message: 'Homing cycle enable',
        category: 'Homing',
        units: 'boolean',
        description: 'Enables homing cycle. Requires limit switches on all axes.',
        inputType: SWITCH
    },
    {
        setting: '$23',
        message: 'Homing direction invert',
        category: 'Homing',
        units: 'mask',
        description: 'Homing searches for a switch in the positive direction. Set axis bit (00000ZYX) to search in negative direction.',
        inputType: MASK
    },
    {
        setting: '$24',
        message: 'Homing locate feed rate',
        category: 'Homing',
        units: 'mm/min',
        description: 'Feed rate to slowly engage limit switch to determine its location accurately.',
        inputType: NUMBER,
        min: 1,
        max: 30,
        step: 1
    },
    {
        setting: '$25',
        message: 'Homing search seek rate',
        category: 'Homing',
        units: 'mm/min',
        description: 'Seek rate to quickly find the limit switch before the slower locating phase.',
        inputType: NUMBER,
        min: 100,
        max: 1000,
        step: 100
    },
    {
        setting: '$26',
        message: 'Homing switch debounce delay',
        category: 'Homing',
        units: 'ms',
        description: 'Sets a short delay between phases of homing cycle to let a switch debounce.',
        inputType: NUMBER,
        min: 5,
        max: 255,
        step: 5
    },
    {
        setting: '$27',
        message: 'Homing switch pull-off distance',
        category: 'Homing',
        units: 'mm',
        description: 'Retract distance after triggering switch to disengage it. Homing will fail if switch isn\'t cleared.',
        inputType: NUMBER,
        min: 0,
        max: 5,
        step: 0.5
    },
    {
        setting: '$30',
        message: 'Maximum spindle speed',
        category: 'Spindle',
        units: 'rpm',
        description: 'Maximum spindle speed. Sets PWM to 100% duty cycle.',
        inputType: NUMBER,
        min: 100,
        max: 10000,
        step: 100
    },
    {
        setting: '$31',
        message: 'Minimum spindle speed',
        category: 'Spindle',
        units: 'rpm',
        description: 'Minimum spindle speed. Sets PWM to 0.4% or lowest duty cycle.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1
    },
    {
        setting: '$32',
        message: 'Laser-mode enabled as spindle',
        category: 'Spindle',
        units: 'boolean',
        description: 'Converts spindle commands into laser mode. Consecutive G1/2/3 commands will not halt when spindle speed is changed.',
        inputType: SWITCH
    },
    {
        setting: '$100',
        message: 'X-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'X-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10
    },
    {
        setting: '$101',
        message: 'Y-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Y-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10
    },
    {
        setting: '$102',
        message: 'Z-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Z-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10
    },
    {
        setting: '$110',
        message: 'X-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'X-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        max: 1500,
        step: 100
    },
    {
        setting: '$111',
        message: 'Y-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Y-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        max: 1500,
        step: 100
    },
    {
        setting: '$112',
        message: 'Z-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Z-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 10,
        max: 1000,
        step: 10
    },
    {
        setting: '$120',
        message: 'X-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description: 'X-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1
    },
    {
        setting: '$121',
        message: 'Y-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description: 'Y-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1
    },
    {
        setting: '$122',
        message: 'Z-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description: 'Z-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1
    },
    {
        setting: '$130',
        message: 'X-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description: 'Maximum X-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10
    },
    {
        setting: '$131',
        message: 'Y-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description: 'Maximum Y-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10
    },
    {
        setting: '$132',
        message: 'Z-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description: 'Maximum Z-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10
    }
];
