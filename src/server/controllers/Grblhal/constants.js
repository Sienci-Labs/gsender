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
export const GRBL_HAL_ACTIVE_STATE_IDLE = 'Idle';
export const GRBL_HAL_ACTIVE_STATE_RUN = 'Run';
export const GRBL_HAL_ACTIVE_STATE_HOLD = 'Hold';
export const GRBL_HAL_ACTIVE_STATE_DOOR = 'Door';
export const GRBL_HAL_ACTIVE_STATE_HOME = 'Home';
export const GRBL_HAL_ACTIVE_STATE_SLEEP = 'Sleep';
export const GRBL_HAL_ACTIVE_STATE_ALARM = 'Alarm';
export const GRBL_HAL_ACTIVE_STATE_CHECK = 'Check';

// Real-time Commands: ~, !, ?, and Ctrl-x
export const GRBLHAL_REALTIME_COMMANDS = {
    CYCLE_START: '~',
    FEED_HOLD: '!',
    STATUS_REPORT: '?',
    CMD_RESET: '\x18',
    COMPLETE_REALTIME_REPORT: String.fromCharCode(0x87),
    VIRTUAL_STOP_TOGGLE: '\x88',
    TOOL_CHANGE_ACK: '\xA3',
    ERR_CLEAR: 'ErrClear',
    GCODE_REPORT: '$G\n',
};

// https://github.com/grbl/grbl/wiki/Configuring-Grbl-v0.9
// http://linuxcnc.org/docs/html/gcode/overview.html#cap:modal-groups
export const GRBL_HAL_MODAL_GROUPS = [
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
export const GRBL_HAL_ERRORS = [
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
        message: 'Homing disabled',
        description: 'Homing cycle failure. Homing is not enabled via settings.'
    },
    {
        code: 6,
        message: 'Value < 2 microseconds',
        description: 'Step pulse time must be greater or equal to 2 microseconds.'
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
        code: 18,
        message: 'Reset asserted',
        description: ''
    },
    {
        code: 19,
        message: 'Non positive value',
        description: ''
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
    },
    {
        code: 39,
        message: 'Invalid gcode ID:39',
        description: 'Value out of range.'
    },
    {
        code: 40,
        message: 'Invalid gcode ID:40',
        description: 'G-code command not allowed when tool change is pending.'
    },
    {
        code: 41,
        message: 'Invalid gcode ID:41',
        description: 'Spindle not running when motion commanded in CSS or spindle sync mode.'
    },
    {
        code: 42,
        message: 'Invalid gcode ID:42',
        description: 'Plane must be ZX for threading.'
    },
    {
        code: 43,
        message: 'Invalid gcode ID:43',
        description: 'Max. feed rate exceeded.'
    },
    {
        code: 44,
        message: 'Invalid gcode ID:44',
        description: 'RPM out of range.'
    },
    {
        code: 45,
        message: 'Limit switch engaged',
        description: 'Only homing is allowed when a limit switch is engaged.'
    },
    {
        code: 46,
        message: 'Homing required',
        description: 'Home machine to continue.'
    },
    {
        code: 47,
        message: 'Invalid gcode ID:47',
        description: 'ATC: current tool is not set. Set current tool with M61.'
    },
    {
        code: 48,
        message: 'Invalid gcode ID:48',
        description: 'Value word conflict.'
    },
    {
        code: 49,
        message: 'Self test failed',
        description: 'Power on self test failed. A hard reset is required.'
    },
    {
        code: 50,
        message: 'E-stop',
        description: 'Emergency stop active.'
    },
    {
        code: 51,
        message: 'Motor fault',
        description: 'Motor fault.'
    },
    {
        code: 52,
        message: 'Value out of range.',
        description: 'Setting value is out of range.'
    },
    {
        code: 53,
        message: 'Setting disabled',
        description: 'Setting is not available, possibly due to limited driver support.'
    },
    {
        code: 54,
        message: 'Invalid gcode ID:54',
        description: 'Retract position is less than drill depth.'
    },
    {
        code: 60,
        message: 'SD Card',
        description: 'SD Card mount failed.'
    },
    {
        code: 61,
        message: 'SD Card',
        description: 'SD Card file open/read failed.'
    },
    {
        code: 62,
        message: 'SD Card',
        description: 'SD Card directory listing failed.'
    },
    {
        code: 63,
        message: 'SD Card',
        description: 'SD Card directory not found.'
    },
    {
        code: 64,
        message: 'SD Card',
        description: 'SD Card file empty.'
    },
    {
        code: 70,
        message: 'Bluetooth',
        description: 'Bluetooth initialisation failed.'
    },
    {
        code: 79,
        message: 'Critical Event',
        description: 'Not allowed while critical event is active.'
    },
];

// Alarms
// https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv
export const GRBL_HAL_ALARMS = [
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
        code: 10,
        message: 'EStop',
        description: 'EStop asserted. Clear and reset.'
    },
    {
        code: 11,
        message: 'Homing required',
        description: 'Homing required. Execute homing command ($H) to continue.'
    },
    {
        code: 12,
        message: 'Limit switch engaged',
        description: 'Limit switch engaged. Clear before continuing.'
    },
    {
        code: 13,
        message: 'Probe protection triggered',
        description: 'Probe protection triggered. Clear before continuing.'
    },
    {
        code: 14,
        message: 'Spindle at speed timeout',
        description: 'Spindle at speed timeout. Clear before continuing.'
    },
    {
        code: 15,
        message: 'Homing fail',
        description: 'Homing fail. Could not find second limit switch for auto squared axis within search distances. Try increasing max travel, decreasing pull-off distance, or check wiring.'
    },
    {
        code: 16,
        message: 'Selftest failed',
        description: 'Power on selftest (POS) failed.'
    },
    {
        code: 17,
        message: 'Motor fault',
        description: 'Motor fault.'
    },
    {
        code: 'Homing',
        message: 'Homing required',
        description: 'Homing must be run if limit switches and homing cycle is enabled in EEPROM'
    }
];

export const GRBL_HAL_SETTINGS_INPUT_TYPES = {
    NUMBER: 'number',
    MASK: 'mask',
    AXIS_MASK: 'axis-mask',
    MASK_STATUS_REPORT: 'mask-status-report',
    SWITCH: 'switch',
    SELECT: 'select',
    STRING: 'string',
};

const { NUMBER, MASK, AXIS_MASK, MASK_STATUS_REPORT, SWITCH, SELECT, STRING } = GRBL_HAL_SETTINGS_INPUT_TYPES;

// Settings
// https://github.com/gnea/grbl/blob/master/doc/csv/setting_codes_en_US.csv
export const GRBL_HAL_SETTINGS = [
    // network interface
    {
        // TODO default value
        // NEW
        setting: '$3x0',
        message: 'Hostname',
        category: 'NetInterface',
        units: '',
        description: 'Hostname.',
        inputType: STRING,
        maxChars: 32
    },
    {
        // TODO default value
        // NEW
        setting: '$3x1',
        message: 'IP Mode',
        category: 'NetInterface',
        units: '',
        description: 'Interface IP mode.',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Static address',
            1: 'DHCP supplied address',
            2: 'Auto IP',
        },
    },
    {
        // TODO not sure about max
        // NEW
        setting: '$3x2',
        message: 'Interface Gateway Address',
        category: 'NetInterface',
        units: '',
        description: 'Interface gateway address. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // TODO not sure about max
        // NEW
        setting: '$3x3',
        message: 'Interface Netmask',
        category: 'NetInterface',
        units: '',
        description: 'Interface netmask. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // TODO not sure about max
        // NEW
        // default 255.255.255.0.
        setting: '$3x4',
        message: 'Interface Netmask',
        category: 'NetInterface',
        units: '',
        description: 'Interface netmask. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: STRING,
    },
    {
        // NEW
        // default value 23
        setting: '$3x5',
        message: 'Telnet port',
        category: 'NetInterface',
        units: '',
        description: 'Port for serial communication, may be telnet protocol or a simple socket stream.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1
    },
    {
        // NEW
        // default value 80
        setting: '$3x6',
        message: 'HTTP port',
        category: 'NetInterface',
        units: '',
        description: 'Web server port.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1
    },
    {
        // NEW
        // default value 81
        setting: '$3x7',
        message: 'Websocket port',
        category: 'NetInterface',
        units: '',
        description: 'Port for two way communication, typically with web browser. Usually used for serial communication by grbl.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1
    },
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
        inputType: AXIS_MASK
    },
    {
        setting: '$3',
        message: 'Step direction invert',
        category: 'Motors',
        units: 'mask',
        description: 'Inverts the direction signal. Set axis bit to invert (00000ZYX).',
        inputType: AXIS_MASK
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
        setting: '$8',
    },
    {
        setting: '$9',
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
        setting: '$14',
    },
    {
        setting: '$15',
    },
    {
        setting: '$16',
    },
    {
        setting: '$17',
    },
    {
        setting: '$18',
    },
    {
        setting: '$19',
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
        // TODO
        /*
            MASK
            - bit0 - enable hard limits.
            - bit1 - enable strict mode when hard limits enabled, this bit cannot be changed when COMPATIBILITY_LEVEL > 1.
        */
        setting: '$21',
        message: 'Hard limits enable',
        category: 'Homing',
        units: 'mask',
        description: 'Enables hard limits. Immediately halts motion and throws an alarm when switch is triggered.',
        inputType: MASK,
        bits: {
            0: 'Enable Hard Limits',
            1: 'Enable Strict Mode when Hard Limits enabled'
        },
        numBits: 2
    },
    {
        // TODO
        /*
            - bit0 - enable homing. Only when this bit is set can the other bits be set.
            - bit1 - enable single axis homing commands.
            - bit2 - homing on startup required.
            - bit3 - set machine origin to 0.
            - bit4 - two switches shares one input pin.
            - bit5 - allow manual homing of axes not automatically homed.
            - bit6 - override locks, allow reset to clear homing on startup required alarm.
            - bit7 - keep homed status on reset if possible.
        */
        setting: '$22',
        message: 'Homing cycle enable',
        category: 'Homing',
        units: 'mask',
        description: 'Enables homing cycle. Requires limit switches on all axes.',
        inputType: MASK,
        bits: {
            0: 'Enable homing.',
            1: 'Enable single axis homing commands.',
            2: 'Homing on startup required.',
            3: 'Set machine origin to 0.',
            4: 'Two switches shares one input pin.',
            5: 'Allow manual homing of axes not automatically homed.',
            6: 'Override locks, allow reset to clear homing on startup required alarm.',
            7: 'Keep homed status on reset if possible.',
        },
        numBits: 8,
        requiredBit: 0
    },
    {
        setting: '$23',
        message: 'Homing direction invert',
        category: 'Homing',
        units: 'mask',
        description: 'Homing searches for a switch in the positive direction. Set axis bit (00000ZYX) to search in negative direction.',
        inputType: AXIS_MASK
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
        // TODO max and default
        // NEW
        setting: '$28',
        message: 'G73 pull-off distance',
        category: 'Homing',
        units: 'mm',
        description: 'Specifies G73 retract distance in mm.',
        inputType: NUMBER,
        min: 0,
        step: 0.5
    },
    {
        // TODO max and default
        // NEW
        setting: '$29',
        message: 'Step Pulse Delay',
        category: 'Homing',
        units: 'μs',
        description: 'Stepper pulse delay in microseconds.',
        inputType: NUMBER,
        min: 0,
        step: 1
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
        // TODO default value
        /*
            it seems we have it as spindle speed, but for grblHAL it’s enabling laser mode
            - 0 - normal mode.
            - 1 - laser mode.
            - 2 - lathe mode.

            we also may want a different input
        */
        setting: '$31',
        message: 'Spindle Mode',
        category: 'Spindle',
        units: '',
        description: 'Specifies Spindle/Laser/Lathe mode',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Normal mode',
            1: 'Laser mode',
            2: 'Lathe mode',
        }
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
        // TODO default
        // NEW
        setting: '$33',
        message: 'Spindle Frequency',
        category: 'Spindle',
        units: 'Hz',
        description: 'Spindle PWM frequency in Hz',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$34',
        message: 'Spindle Duty Cycle',
        category: 'Spindle',
        units: '%',
        description: 'Spindle off PWM duty cycle in percent',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1
    },
    {
        // NEW
        setting: '$35',
        message: 'Minimum spindle speed',
        category: 'Spindle',
        units: '%',
        description: 'Minimum spindle speed. Sets PWM to 0.4% or lowest duty cycle.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1
    },
    {
        // NEW
        setting: '$36',
        message: 'Maximum spindle speed',
        category: 'Spindle',
        units: '%',
        description: 'Maximum spindle speed.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1
    },
    {
        // NEW
        setting: '$37',
        message: 'Deenergized Steppers',
        category: 'Spindle',
        units: '%',
        description: 'Defines which steppers is to be deenergized when motion completes.',
        inputType: AXIS_MASK,
        min: 1,
        max: 100,
        step: 1
    },
    {
        // TODO max
        // NEW
        setting: '$38',
        message: 'Encoder Pulses',
        category: 'Spindle',
        units: '/revolution',
        description: 'Spindle encoder pulses per revolution.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1
    },
    {
        // NEW
        /*
            - default 1, enable
            - 0, disable
                (when disabled these characters (?, ! and ~)
                are ignored as realtime commands and added to the input
                instead when part of a comment or a $-setting.)
        */
        setting: '$39',
        message: 'Printable Command Characters',
        category: 'Spindle',
        units: 'boolean',
        description: 'Enable printable realtime command characters.',
        inputType: SWITCH,
    },
    {
        // NEW
        setting: '$40',
        message: 'Soft Limits Jogging',
        category: 'Motors',
        units: 'boolean',
        description: 'Enable soft limits for jogging. When enabled jog targets will be limited to machine travel limits for homed axes.',
        inputType: SWITCH,
    },
    {
        setting: '$41',
    },
    {
        setting: '$42',
    },
    {
        // NEW
        setting: '$43',
        message: 'Homing Locate Cycle',
        category: 'Homing',
        units: '',
        description: 'Number of homing locate cycles.',
        inputType: NUMBER,
        min: 0,
        max: 255,
        step: 1
    },
    {
        // NEW
        setting: '$44',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$45',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$46',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$47',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$48',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$49',
        message: 'Axis Mask',
        category: 'Homing',
        units: '',
        description: 'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$50',
        message: 'Jogging Step Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging step speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$51',
        message: 'Jogging Slow Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging slow speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$52',
        message: 'Jogging Fast Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging fast speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$53',
        message: 'Jogging Step Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging step distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$54',
        message: 'Jogging Slow Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging slow distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        // NEW
        setting: '$55',
        message: 'Jogging Fast Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging fast distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1
    },
    {
        setting: '$56',
    },
    {
        setting: '$57',
    },
    {
        setting: '$58',
    },
    {
        setting: '$59',
    },
    {
        // NEW
        // default 1 (on)
        setting: '$60',
        message: 'Restore Default Overrides',
        category: 'GRBL',
        units: 'boolean',
        description: 'Restore default overrides when program ends.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$61',
        message: 'Ignore Safety Door Signal',
        category: 'GRBL',
        units: 'boolean',
        description: 'Ignore safety door signal when idle. If on only the spindle (laser) will be switched off. May be useful if positioning a laser head with the lid open is needed.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$62',
        message: 'Sleep Function',
        category: 'GRBL',
        units: 'boolean',
        description: 'Enable sleep function.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (on)
        setting: '$63',
        message: 'Disable Laser on Hold',
        category: 'GRBL',
        units: 'boolean',
        description: 'Disable laser during hold.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$64',
        message: 'Alarm on Startup',
        category: 'GRBL',
        units: 'boolean',
        description: 'Force grbl to enter alarm mode on startup.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$65',
        message: 'Allow Feedrate Override',
        category: 'GRBL',
        units: 'boolean',
        description: 'Allow feed rate override during probing.',
        inputType: SWITCH,
    },
    // Network Settings
    {
        // NEW
        /*
            Bit 0: Telnet
            Bit 1: Websocket
            Bit 2: HTTP
            Bit 3: FTP
            Bit 4: DNS
            Bit 5: mDNS
            Bit 6: SSDP
            Bit 7: WebDAV
        */
        setting: '$70',
        message: 'Network Service',
        category: 'Network',
        units: '',
        description: 'Specify Network Service.',
        inputType: MASK,
        bits: {
            0: 'Telnet',
            1: 'Websocket',
            2: 'HTTP',
            3: 'FTP',
            4: 'DNS',
            5: 'mDNS',
            6: 'SSDP',
            7: 'WebDAV',
        },
        numBits: 8
    },
    {
        // NEW
        // default "GRBL"
        setting: '$71',
        message: 'Bluetooth Device',
        category: 'Network',
        units: '',
        description: 'Bluetooth device name.',
        inputType: STRING,
        maxChars: 32
    },
    {
        // NEW
        // default "GRBL serial port"
        setting: '$72',
        message: 'Bluetooth Service',
        category: 'Network',
        units: '',
        description: 'Bluetooth service name.',
        inputType: STRING,
        maxChars: 32
    },
    {
        // TODO default value
        // NEW
        /*
            0: NULL
            1: STA - Station
            2: AP - Access Point
            3: APSTA - Access Point + Station
        */
        setting: '$73',
        message: 'Wi-Fi Mode',
        category: 'Network',
        units: '',
        description: 'Wi-Fi Mode.',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'NULL',
            1: 'STA',
            2: 'AP',
            3: 'APSTA',
        }
    },
    {
        // NEW
        // default empty
        setting: '$74',
        message: 'Wi-Fi STA SSID',
        category: 'Network',
        units: '',
        description: 'WiFi STA (Station) SSID.',
        inputType: STRING,
        maxChars: 64
    },
    {
        // NEW
        // default empty
        setting: '$75',
        message: 'Wi-Fi STA Password',
        category: 'Network',
        units: '',
        description: 'WiFi STA (Station) password.',
        inputType: STRING,
        maxChars: 32
    },
    {
        // NEW
        // default empty
        setting: '$76',
        message: 'Wi-Fi AP SSID',
        category: 'Network',
        units: '',
        description: 'WiFi AP (Access Point) SSID.',
        inputType: STRING,
        maxChars: 64
    },
    {
        // TODO default
        // NEW
        // default provided by driver. blank = AP is "Open"
        setting: '$77',
        message: 'Wi-Fi AP Password',
        category: 'Network',
        units: '',
        description: 'WiFi AP (Access Point) password.',
        inputType: STRING,
        maxChars: 32
    },
    {
        // NEW
        // default empty
        setting: '$78',
        message: 'Wi-Fi Country',
        category: 'Network',
        units: '',
        description: 'WiFi AP Country (Access Point).',
        inputType: STRING,
        maxChars: 3
    },
    {
        // NEW
        // default 0
        setting: '$79',
        message: 'Wi-Fi AP Channel Password',
        category: 'Network',
        units: '',
        description: 'WiFi AP Channel (Access Point) password.',
        inputType: NUMBER,
        min: 0,
        max: 11,
        step: 1
    },
    {
        // TODO default
        // NEW
        setting: '$80',
        message: 'Spindle PID Regulator Proportional Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator proportional gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$81',
        message: 'Spindle PID Regulator Integral Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator integral gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$82',
        message: 'Spindle PID Regulator Derivative Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator derivative gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$84',
        message: 'Spindle PID Max Output Error',
        category: 'PID',
        units: '',
        description: 'Spindle PID max output error.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$85',
        message: 'Spindle PID Max Output Error',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator max integral error.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$90',
        message: 'Spindle Sunced Motion PID Regulator Proportional Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator proportional gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$91',
        message: 'Spindle Sunced Motion PID Regulator Integral Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator integral gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
    },
    {
        // NEW
        setting: '$92',
        message: 'Spindle Sunced Motion PID Regulator Derivative Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator derivative gain.',
        inputType: NUMBER,
        min: 0,
        step: 1
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
    },
    {
        setting: '$160',
    },
    {
        setting: '$161',
    },
    {
        setting: '$162',
    },
    {
        setting: '$170',
    },
    {
        setting: '$171',
    },
    {
        setting: '$172',
    },
    // spindle related settings
    {
        // NEW
        // default 0 percent
        setting: '$340',
        message: 'Spindle at speed tolerance',
        category: 'Limits',
        units: '%',
        description: 'Available for drivers and plugins that supports spindle at speed functionality. If set to a value > 0 then alarm 14 will be issued if the spindle speed is not within tolerance during a timeout delay.',
        inputType: NUMBER,
        min: 0,
        max: 100,
        step: 10
    },
    // manual tool change settings
    {
        // TODO type
        /*
            0: Normal. Manual tool change and touch off via jogging.
            1: Manual touch off. Initial move to linear axis home position for tool change, manual or automatic touch off with $TPW command.
            2: Manual touch off @ G59.3. Initial move to linear axis home position then to G59.3 position for tool change, manual or automatic touch off with $TPW command.
            3: Manual touch off @ G59.3. Initial move to linear axis home position for tool change then to G59.3 position for automatic touch off.
            4: Ignore M6.

            Note: Mode 1 and 2 requires initial tool offset set when $TPW command is used for touch off. In mode 2 a successful touch off will automatically
            Note: Mode 3 requires initial tool offset set.
        */
        // NEW
        // default 0
        setting: '$341',
        message: 'Manual tool change mode',
        category: 'Limits',
        units: '',
        description: 'Available for drivers and plugins that supports spindle at speed functionality. If set to a value > 0 then alarm 14 will be issued if the spindle speed is not within tolerance during a timeout delay.',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Normal',
            1: 'Manual touch off',
            2: 'Manual touch off @ G59.3, tool change @ home',
            3: 'Manual touch off @ G59.3, tool change @ G59.3',
            4: 'Ignore M6',
        }
    },
    {
        // TODO dont know max
        // NEW
        // default 30mm
        setting: '$342',
        message: 'Probing distance',
        category: 'Limits',
        units: 'mm',
        description: 'Used in mode 1 and 2 when $TPW command is issued and in mode 3.',
        inputType: NUMBER,
        min: 0,
        step: 10
    },
    {
        // TODO dont know max
        // NEW
        // default 25mm/min
        setting: '$343',
        message: 'Probing slow feed rate',
        category: 'Limits',
        units: 'mm/min',
        description: 'Used in mode 1 and 2 when $TPW command is issued and in mode 3 to obtain an accurate tool offset.',
        inputType: NUMBER,
        min: 0,
        step: 10
    },
    {
        // TODO dont know max
        // NEW
        // default 200mm/min
        setting: '$344',
        message: 'Probing seek feed rate',
        category: 'Limits',
        units: 'mm/min',
        description: 'Used in mode 1 and 2 when $TPW command is issued and in mode 3 to obtain an initial tool offset. If successful tool is backed off a bit and probing is redone with the slow feed rate from $343.',
        inputType: NUMBER,
        min: 0,
        step: 10
    },
    {
        setting: '$345',
    },
    {
        setting: '$347',
    },
    {
        setting: '$348',
    },
    {
        setting: '$349',
    },
    {
        setting: '$370',
    },
    {
        setting: '$372',
    },
    {
        setting: '$374',
    },
    {
        setting: '$375',
    },
    {
        setting: '$384',
    },
    {
        setting: '$392',
    },
    {
        setting: '$393',
    },
    {
        setting: '$395',
    },
    {
        setting: '$450',
    },
    {
        setting: '$451',
    },
    {
        setting: '$452',
    },
    {
        setting: '$453',
    },
    {
        setting: '$454',
    },
    {
        setting: '$455',
    },
    {
        setting: '$456',
    },
    {
        setting: '$460',
    },
    {
        setting: '$461',
    },
    {
        setting: '$462',
    },
    {
        setting: '$463',
    },
    {
        setting: '$464',
    },
    {
        setting: '$465',
    },
    {
        setting: '$466',
    },
    {
        setting: '$467',
    },
    {
        setting: '$468',
    },
    {
        setting: '$469',
    },
    {
        setting: '$470',
    },
    {
        setting: '$471',
    },
];
