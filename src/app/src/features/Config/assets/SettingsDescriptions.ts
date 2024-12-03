export const GRBL_HAL_SETTINGS_INPUT_TYPES = {
    NUMBER: 'number',
    MASK: 'mask',
    AXIS_MASK: 'axis-mask',
    MASK_STATUS_REPORT: 'mask-status-report',
    SWITCH: 'switch',
    SELECT: 'select',
    STRING: 'string',
};

const { NUMBER, MASK, AXIS_MASK, MASK_STATUS_REPORT, SWITCH, SELECT, STRING } =
    GRBL_HAL_SETTINGS_INPUT_TYPES;
// Settings
// https://github.com/gnea/grbl/blob/master/doc/csv/setting_codes_en_US.csv
export const GRBL_SETTINGS = [
    {
        setting: '$0',
        description: 'Step pulse time',
        category: 'Motors',
        units: 'μs',
        description: 'Sets time length per step. Minimum 3usec.',
        inputType: NUMBER,
        min: 0,
        max: 20,
        step: 1,
    },
    {
        setting: '$1',
        description: 'Step idle delay',
        category: 'Motors',
        units: 'ms',
        description:
            'Sets a short hold delay when stopping to let dynamics settle before disabling steppers. Value 255 keeps motors enabled with no delay.',
        inputType: NUMBER,
        min: 25,
        max: 255,
        step: 5,
    },
    {
        setting: '$2',
        description: 'Step pulse invert',
        category: 'Motors',
        units: 'mask',
        description:
            'Inverts the step signal. Set axis bit to invert (00000ZYX).',
        inputType: AXIS_MASK,
    },
    {
        setting: '$3',
        description: 'Step direction invert',
        category: 'Motors',
        units: 'mask',
        description:
            'Inverts the direction signal. Set axis bit to invert (00000ZYX).',
        inputType: AXIS_MASK,
    },
    {
        setting: '$4',
        description: 'Invert step enable pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the stepper driver enable pin signal.',
        inputType: SWITCH,
    },
    {
        setting: '$5',
        description: 'Invert limit pins',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the all of the limit input pins.',
        inputType: SWITCH,
    },
    {
        setting: '$6',
        description: 'Invert probe pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the probe input pin signal.',
        inputType: SWITCH,
    },
    {
        setting: '$10',
        description: 'Status report options',
        category: 'GRBL',
        units: 'mask',
        description: 'Alters data included in status reports.',
        inputType: MASK_STATUS_REPORT,
    },
    {
        setting: '$11',
        description: 'Junction deviation',
        category: 'GRBL',
        units: 'mm',
        description:
            'Sets how fast Grbl travels through consecutive motions. Lower value slows it down.',
        inputType: NUMBER,
        min: 0.001,
        step: 0.001,
    },
    {
        setting: '$12',
        description: 'Arc tolerance',
        category: 'GRBL',
        units: 'mm',
        description:
            'Sets the G2 and G3 arc tracing accuracy based on radial error. Beware: A very small value may effect performance.',
        inputType: NUMBER,
        min: 0.001,
        step: 0.001,
    },
    {
        setting: '$13',
        description: 'Report in inches',
        category: 'GRBL',
        units: 'boolean',
        description:
            'Enables inch units when returning any position and rate value that is not a settings value.',
        inputType: SWITCH,
    },
    {
        setting: '$20',
        description: 'Soft limits enable',
        category: 'Homing',
        units: 'boolean',
        description:
            'Enables soft limits checks within machine travel and sets alarm when exceeded. Requires homing.',
        inputType: SWITCH,
    },
    {
        setting: '$21',
        description: 'Hard limits enable',
        category: 'Homing',
        units: 'boolean',
        description:
            'Enables hard limits. Immediately halts motion and throws an alarm when switch is triggered.',
        inputType: SWITCH,
    },
    {
        setting: '$22',
        description: 'Homing cycle enable',
        category: 'Homing',
        units: 'boolean',
        description:
            'Enables homing cycle. Requires limit switches on all axes.',
        inputType: SWITCH,
    },
    {
        setting: '$23',
        description: 'Homing direction invert',
        category: 'Homing',
        units: 'mask',
        description:
            'Homing searches for a switch in the positive direction. Set axis bit (00000ZYX) to search in negative direction.',
        inputType: AXIS_MASK,
    },
    {
        setting: '$24',
        description: 'Homing locate feed rate',
        category: 'Homing',
        units: 'mm/min',
        description:
            'Feed rate to slowly engage limit switch to determine its location accurately.',
        inputType: NUMBER,
        min: 1,
        step: 1,
    },
    {
        setting: '$25',
        description: 'Homing search seek rate',
        category: 'Homing',
        units: 'mm/min',
        description:
            'Seek rate to quickly find the limit switch before the slower locating phase.',
        inputType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$26',
        description: 'Homing switch debounce delay',
        category: 'Homing',
        units: 'ms',
        description:
            'Sets a short delay between phases of homing cycle to let a switch debounce.',
        inputType: NUMBER,
        min: 5,
        max: 255,
        step: 5,
    },
    {
        setting: '$27',
        description: 'Homing switch pull-off distance',
        category: 'Homing',
        units: 'mm',
        description:
            "Retract distance after triggering switch to disengage it. Homing will fail if switch isn't cleared.",
        inputType: NUMBER,
        min: 0,
        step: 0.5,
    },
    {
        setting: '$30',
        description: 'Maximum spindle speed',
        category: 'Spindle',
        units: 'rpm',
        description: 'Maximum spindle speed. Sets PWM to 100% duty cycle.',
        inputType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$31',
        description: 'Minimum spindle speed',
        category: 'Spindle',
        units: 'rpm',
        description:
            'Minimum spindle speed. Sets PWM to 0.4% or lowest duty cycle.',
        inputType: NUMBER,
        min: 1,
        step: 1,
    },
    {
        setting: '$32',
        description: 'Laser-mode enabled as spindle',
        category: 'Spindle',
        units: 'boolean',
        description:
            'Converts spindle commands into laser mode. Consecutive G1/2/3 commands will not halt when spindle speed is changed.',
        inputType: SWITCH,
    },
    {
        setting: '$100',
        description: 'X-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'X-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$101',
        description: 'Y-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Y-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$102',
        description: 'Z-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Z-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$110',
        description: 'X-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'X-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$111',
        description: 'Y-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Y-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$112',
        description: 'Z-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Z-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$120',
        description: 'X-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'X-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$121',
        description: 'Y-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'Y-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$122',
        description: 'Z-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'Z-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$130',
        description: 'X-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum X-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$131',
        description: 'Y-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum Y-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$132',
        description: 'Z-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum Z-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        step: 10,
    },
];

export const GRBL_HAL_SETTINGS = [
    // network interface
    {
        // TODO default value
        // NEW
        setting: '$3x0',
        description: 'Hostname',
        category: 'NetInterface',
        units: '',
        description: 'Hostname.',
        inputType: STRING,
        maxChars: 32,
    },
    {
        // TODO default value
        // NEW
        setting: '$3x1',
        description: 'IP Mode',
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
        description: 'Interface Gateway Address',
        category: 'NetInterface',
        units: '',
        description:
            'Interface gateway address. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // TODO not sure about max
        // NEW
        setting: '$3x3',
        description: 'Interface Netmask',
        category: 'NetInterface',
        units: '',
        description:
            'Interface netmask. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // TODO not sure about max
        // NEW
        // default 255.255.255.0.
        setting: '$3x4',
        description: 'Interface Netmask',
        category: 'NetInterface',
        units: '',
        description:
            'Interface netmask. IPv4 or IPv6 address, up to 16 octets. May hold IPv4 address as either binary or text.',
        inputType: STRING,
    },
    {
        // NEW
        // default value 23
        setting: '$3x5',
        description: 'Telnet port',
        category: 'NetInterface',
        units: '',
        description:
            'Port for serial communication, may be telnet protocol or a simple socket stream.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        // NEW
        // default value 80
        setting: '$3x6',
        description: 'HTTP port',
        category: 'NetInterface',
        units: '',
        description: 'Web server port.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        // NEW
        // default value 81
        setting: '$3x7',
        description: 'Websocket port',
        category: 'NetInterface',
        units: '',
        description:
            'Port for two way communication, typically with web browser. Usually used for serial communication by grbl.',
        inputType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        setting: '$0',
        description: 'Step pulse time',
        category: 'Motors',
        units: 'μs',
        description: 'Sets time length per step. Minimum 3usec.',
        inputType: NUMBER,
        min: 3,
        max: 12,
        step: 1,
    },
    {
        setting: '$1',
        description: 'Step idle delay',
        category: 'Motors',
        units: 'ms',
        description:
            'Sets a short hold delay when stopping to let dynamics settle before disabling steppers. Value 255 keeps motors enabled with no delay.',
        inputType: NUMBER,
        min: 25,
        max: 255,
        step: 5,
    },
    {
        setting: '$2',
        description: 'Step pulse invert',
        category: 'Motors',
        units: 'mask',
        description:
            'Inverts the step signal. Set axis bit to invert (00000ZYX).',
        inputType: AXIS_MASK,
    },
    {
        setting: '$3',
        description: 'Step direction invert',
        category: 'Motors',
        units: 'mask',
        description:
            'Inverts the direction signal. Set axis bit to invert (00000ZYX).',
        inputType: AXIS_MASK,
    },
    {
        setting: '$4',
        description: 'Invert step enable pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the stepper driver enable pin signal.',
        inputType: SWITCH,
    },
    {
        setting: '$5',
        description: 'Invert limit pins',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the all of the limit input pins.',
        inputType: SWITCH,
    },
    {
        setting: '$6',
        description: 'Invert probe pin',
        category: 'Pins',
        units: 'boolean',
        description: 'Inverts the probe input pin signal.',
        inputType: SWITCH,
    },
    {
        setting: '$8',
    },
    {
        setting: '$9',
    },
    {
        setting: '$10',
        description: 'Status report options',
        category: 'GRBL',
        units: 'mask',
        description: 'Alters data included in status reports.',
        inputType: MASK_STATUS_REPORT,
    },
    {
        setting: '$11',
        description: 'Junction deviation',
        category: 'GRBL',
        units: 'mm',
        description:
            'Sets how fast Grbl travels through consecutive motions. Lower value slows it down.',
        inputType: NUMBER,
        min: 0.001,
        max: 0.02,
        step: 0.001,
    },
    {
        setting: '$12',
        description: 'Arc tolerance',
        category: 'GRBL',
        units: 'mm',
        description:
            'Sets the G2 and G3 arc tracing accuracy based on radial error. Beware: A very small value may effect performance.',
        inputType: NUMBER,
        min: 0.001,
        max: 0.003,
        step: 0.001,
    },
    {
        setting: '$13',
        description: 'Report in inches',
        category: 'GRBL',
        units: 'boolean',
        description:
            'Enables inch units when returning any position and rate value that is not a settings value.',
        inputType: SWITCH,
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
        description: 'Soft limits enable',
        category: 'Homing',
        units: 'boolean',
        description:
            'Enables soft limits checks within machine travel and sets alarm when exceeded. Requires homing.',
        inputType: SWITCH,
    },
    {
        // TODO
        /*
            MASK
            - bit0 - enable hard limits.
            - bit1 - enable strict mode when hard limits enabled, this bit cannot be changed when COMPATIBILITY_LEVEL > 1.
        */
        setting: '$21',
        description: 'Hard limits enable',
        category: 'Homing',
        units: 'mask',
        description:
            'Enables hard limits. Immediately halts motion and throws an alarm when switch is triggered.',
        inputType: MASK,
        bits: {
            0: 'Enable Hard Limits',
            1: 'Enable Strict Mode when Hard Limits enabled',
        },
        numBits: 2,
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
        description: 'Homing cycle enable',
        category: 'Homing',
        units: 'mask',
        description:
            'Enables homing cycle. Requires limit switches on all axes.',
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
        requiredBit: 0,
    },
    {
        setting: '$23',
        description: 'Homing direction invert',
        category: 'Homing',
        units: 'mask',
        description:
            'Homing searches for a switch in the positive direction. Set axis bit (00000ZYX) to search in negative direction.',
        inputType: AXIS_MASK,
    },
    {
        setting: '$24',
        description: 'Homing locate feed rate',
        category: 'Homing',
        units: 'mm/min',
        description:
            'Feed rate to slowly engage limit switch to determine its location accurately.',
        inputType: NUMBER,
        min: 1,
        max: 30,
        step: 1,
    },
    {
        setting: '$25',
        description: 'Homing search seek rate',
        category: 'Homing',
        units: 'mm/min',
        description:
            'Seek rate to quickly find the limit switch before the slower locating phase.',
        inputType: NUMBER,
        min: 100,
        max: 1000,
        step: 100,
    },
    {
        setting: '$26',
        description: 'Homing switch debounce delay',
        category: 'Homing',
        units: 'ms',
        description:
            'Sets a short delay between phases of homing cycle to let a switch debounce.',
        inputType: NUMBER,
        min: 5,
        max: 255,
        step: 5,
    },
    {
        setting: '$27',
        description: 'Homing switch pull-off distance',
        category: 'Homing',
        units: 'mm',
        description:
            "Retract distance after triggering switch to disengage it. Homing will fail if switch isn't cleared.",
        inputType: NUMBER,
        min: 0,
        max: 5,
        step: 0.5,
    },
    {
        // TODO max and default
        // NEW
        setting: '$28',
        description: 'G73 pull-off distance',
        category: 'Homing',
        units: 'mm',
        description: 'Specifies G73 retract distance in mm.',
        inputType: NUMBER,
        min: 0,
        step: 0.5,
    },
    {
        // TODO max and default
        // NEW
        setting: '$29',
        description: 'Step Pulse Delay',
        category: 'Homing',
        units: 'μs',
        description: 'Stepper pulse delay in microseconds.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        setting: '$30',
        description: 'Maximum spindle speed',
        category: 'Spindle',
        units: 'rpm',
        description: 'Maximum spindle speed. Sets PWM to 100% duty cycle.',
        inputType: NUMBER,
        min: 100,
        max: 10000,
        step: 100,
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
        description: 'Spindle Mode',
        category: 'Spindle',
        units: '',
        description: 'Specifies Spindle/Laser/Lathe mode',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Normal mode',
            1: 'Laser mode',
            2: 'Lathe mode',
        },
    },
    {
        setting: '$32',
        description: 'Laser-mode enabled as spindle',
        category: 'Spindle',
        units: 'boolean',
        description:
            'Converts spindle commands into laser mode. Consecutive G1/2/3 commands will not halt when spindle speed is changed.',
        inputType: SWITCH,
    },
    {
        // TODO default
        // NEW
        setting: '$33',
        description: 'Spindle Frequency',
        category: 'Spindle',
        units: 'Hz',
        description: 'Spindle PWM frequency in Hz',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$34',
        description: 'Spindle Duty Cycle',
        category: 'Spindle',
        units: '%',
        description: 'Spindle off PWM duty cycle in percent',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$35',
        description: 'Minimum spindle speed',
        category: 'Spindle',
        units: '%',
        description:
            'Minimum spindle speed. Sets PWM to 0.4% or lowest duty cycle.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$36',
        description: 'Maximum spindle speed',
        category: 'Spindle',
        units: '%',
        description: 'Maximum spindle speed.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$37',
        description: 'Deenergized Steppers',
        category: 'Spindle',
        units: '%',
        description:
            'Defines which steppers is to be deenergized when motion completes.',
        inputType: AXIS_MASK,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // TODO max
        // NEW
        setting: '$38',
        description: 'Encoder Pulses',
        category: 'Spindle',
        units: '/revolution',
        description: 'Spindle encoder pulses per revolution.',
        inputType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
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
        description: 'Printable Command Characters',
        category: 'Spindle',
        units: 'boolean',
        description: 'Enable printable realtime command characters.',
        inputType: SWITCH,
    },
    {
        // NEW
        setting: '$40',
        description: 'Soft Limits Jogging',
        category: 'Motors',
        units: 'boolean',
        description:
            'Enable soft limits for jogging. When enabled jog targets will be limited to machine travel limits for homed axes.',
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
        description: 'Homing Locate Cycle',
        category: 'Homing',
        units: '',
        description: 'Number of homing locate cycles.',
        inputType: NUMBER,
        min: 0,
        max: 255,
        step: 1,
    },
    {
        // NEW
        setting: '$44',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$45',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$46',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$47',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$48',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$49',
        description: 'Axis Mask',
        category: 'Homing',
        units: '',
        description:
            'Axis priority for homing lowest numbered executed first, number of available settings is same as number of supported axes. Replaces #define HOMING_CYCLE_0 etc.',
        inputType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$50',
        description: 'Jogging Step Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging step speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$51',
        description: 'Jogging Slow Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging slow speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$52',
        description: 'Jogging Fast Speed',
        category: 'Motors',
        units: 'mm/min',
        description: 'Jogging fast speed in mm/min. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$53',
        description: 'Jogging Step Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging step distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$54',
        description: 'Jogging Slow Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging slow distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$55',
        description: 'Jogging Fast Distance',
        category: 'Motors',
        units: 'mm',
        description: 'Jogging fast distance in mm. Used by driver/sender',
        inputType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
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
        description: 'Restore Default Overrides',
        category: 'GRBL',
        units: 'boolean',
        description: 'Restore default overrides when program ends.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$61',
        description: 'Ignore Safety Door Signal',
        category: 'GRBL',
        units: 'boolean',
        description:
            'Ignore safety door signal when idle. If on only the spindle (laser) will be switched off. May be useful if positioning a laser head with the lid open is needed.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$62',
        description: 'Sleep Function',
        category: 'GRBL',
        units: 'boolean',
        description: 'Enable sleep function.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (on)
        setting: '$63',
        description: 'Disable Laser on Hold',
        category: 'GRBL',
        units: 'boolean',
        description: 'Disable laser during hold.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$64',
        description: 'Alarm on Startup',
        category: 'GRBL',
        units: 'boolean',
        description: 'Force grbl to enter alarm mode on startup.',
        inputType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$65',
        description: 'Allow Feedrate Override',
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
        description: 'Network Service',
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
        numBits: 8,
    },
    {
        // NEW
        // default "GRBL"
        setting: '$71',
        description: 'Bluetooth Device',
        category: 'Network',
        units: '',
        description: 'Bluetooth device name.',
        inputType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default "GRBL serial port"
        setting: '$72',
        description: 'Bluetooth Service',
        category: 'Network',
        units: '',
        description: 'Bluetooth service name.',
        inputType: STRING,
        maxChars: 32,
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
        description: 'Wi-Fi Mode',
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
        },
    },
    {
        // NEW
        // default empty
        setting: '$74',
        description: 'Wi-Fi STA SSID',
        category: 'Network',
        units: '',
        description: 'WiFi STA (Station) SSID.',
        inputType: STRING,
        maxChars: 64,
    },
    {
        // NEW
        // default empty
        setting: '$75',
        description: 'Wi-Fi STA Password',
        category: 'Network',
        units: '',
        description: 'WiFi STA (Station) password.',
        inputType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default empty
        setting: '$76',
        description: 'Wi-Fi AP SSID',
        category: 'Network',
        units: '',
        description: 'WiFi AP (Access Point) SSID.',
        inputType: STRING,
        maxChars: 64,
    },
    {
        // TODO default
        // NEW
        // default provided by driver. blank = AP is "Open"
        setting: '$77',
        description: 'Wi-Fi AP Password',
        category: 'Network',
        units: '',
        description: 'WiFi AP (Access Point) password.',
        inputType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default empty
        setting: '$78',
        description: 'Wi-Fi Country',
        category: 'Network',
        units: '',
        description: 'WiFi AP Country (Access Point).',
        inputType: STRING,
        maxChars: 3,
    },
    {
        // NEW
        // default 0
        setting: '$79',
        description: 'Wi-Fi AP Channel Password',
        category: 'Network',
        units: '',
        description: 'WiFi AP Channel (Access Point) password.',
        inputType: NUMBER,
        min: 0,
        max: 11,
        step: 1,
    },
    {
        // TODO default
        // NEW
        setting: '$80',
        description: 'Spindle PID Regulator Proportional Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator proportional gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$81',
        description: 'Spindle PID Regulator Integral Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator integral gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$82',
        description: 'Spindle PID Regulator Derivative Gain',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator derivative gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$84',
        description: 'Spindle PID Max Output Error',
        category: 'PID',
        units: '',
        description: 'Spindle PID max output error.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$85',
        description: 'Spindle PID Max Output Error',
        category: 'PID',
        units: '',
        description: 'Spindle PID regulator max integral error.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$90',
        description: 'Spindle Sunced Motion PID Regulator Proportional Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator proportional gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$91',
        description: 'Spindle Sunced Motion PID Regulator Integral Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator integral gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$92',
        description: 'Spindle Sunced Motion PID Regulator Derivative Gain',
        category: 'PID',
        units: '',
        description: 'Spindle synced motion PID regulator derivative gain.',
        inputType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        setting: '$100',
        description: 'X-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'X-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$101',
        description: 'Y-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Y-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$102',
        description: 'Z-axis travel resolution',
        category: 'Motors',
        units: 'step/mm',
        description: 'Z-axis travel resolution in steps per millimeter.',
        inputType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$110',
        description: 'X-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'X-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        max: 1500,
        step: 100,
    },
    {
        setting: '$111',
        description: 'Y-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Y-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 100,
        max: 1500,
        step: 100,
    },
    {
        setting: '$112',
        description: 'Z-axis maximum rate',
        category: 'Motors',
        units: 'mm/min',
        description: 'Z-axis maximum rate. Used as G0 rapid rate.',
        inputType: NUMBER,
        min: 10,
        max: 1000,
        step: 10,
    },
    {
        setting: '$120',
        description: 'X-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'X-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$121',
        description: 'Y-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'Y-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$122',
        description: 'Z-axis acceleration',
        category: 'Motors',
        units: 'mm/sec^2',
        description:
            'Z-axis acceleration. Used for motion planning to not exceed motor torque and lose steps.',
        inputType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$130',
        description: 'X-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum X-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10,
    },
    {
        setting: '$131',
        description: 'Y-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum Y-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10,
    },
    {
        setting: '$132',
        description: 'Z-axis maximum travel',
        category: 'Limits',
        units: 'mm',
        description:
            'Maximum Z-axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.',
        inputType: NUMBER,
        min: 1,
        max: 1500,
        step: 10,
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
        description: 'Spindle at speed tolerance',
        category: 'Limits',
        units: '%',
        description:
            'Available for drivers and plugins that supports spindle at speed functionality. If set to a value > 0 then alarm 14 will be issued if the spindle speed is not within tolerance during a timeout delay.',
        inputType: NUMBER,
        min: 0,
        max: 100,
        step: 10,
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
        description: 'Manual tool change mode',
        category: 'Limits',
        units: '',
        description:
            'Available for drivers and plugins that supports spindle at speed functionality. If set to a value > 0 then alarm 14 will be issued if the spindle speed is not within tolerance during a timeout delay.',
        inputType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Normal',
            1: 'Manual touch off',
            2: 'Manual touch off @ G59.3, tool change @ home',
            3: 'Manual touch off @ G59.3, tool change @ G59.3',
            4: 'Ignore M6',
        },
    },
    {
        // TODO dont know max
        // NEW
        // default 30mm
        setting: '$342',
        description: 'Probing distance',
        category: 'Limits',
        units: 'mm',
        description:
            'Used in mode 1 and 2 when $TPW command is issued and in mode 3.',
        inputType: NUMBER,
        min: 0,
        step: 10,
    },
    {
        // TODO dont know max
        // NEW
        // default 25mm/min
        setting: '$343',
        description: 'Probing slow feed rate',
        category: 'Limits',
        units: 'mm/min',
        description:
            'Used in mode 1 and 2 when $TPW command is issued and in mode 3 to obtain an accurate tool offset.',
        inputType: NUMBER,
        min: 0,
        step: 10,
    },
    {
        // TODO dont know max
        // NEW
        // default 200mm/min
        setting: '$344',
        description: 'Probing seek feed rate',
        category: 'Limits',
        units: 'mm/min',
        description:
            'Used in mode 1 and 2 when $TPW command is issued and in mode 3 to obtain an initial tool offset. If successful tool is backed off a bit and probing is redone with the slow feed rate from $343.',
        inputType: NUMBER,
        min: 0,
        step: 10,
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
