import type { EEPROM } from 'app/definitions/firmware';
import { tk } from 'app/i18n';

export const GRBL_HAL_SETTINGS_INPUT_TYPES = {
    NUMBER: '5',
    MASK: '1',
    AXIS_MASK: '4',
    MASK_STATUS_REPORT: '0',
    SWITCH: '0',
    SELECT: '3',
    STRING: '7',
};

const { NUMBER, MASK, AXIS_MASK, MASK_STATUS_REPORT, SWITCH, SELECT, STRING } =
    GRBL_HAL_SETTINGS_INPUT_TYPES;
// Settings
// https://github.com/gnea/grbl/blob/master/doc/csv/setting_codes_en_US.csv
export const GRBL_SETTINGS = [
    {
        setting: '$0',
        description: tk('config:firmware.grbl.0.description'),
        category: 'Motors',
        units: 'μs',
        details: tk('config:firmware.grbl.0.details'),
        dataType: NUMBER,
        min: 0,
        max: 20,
        step: 1,
    },
    {
        setting: '$1',
        description: tk('config:firmware.grbl.1.description'),
        category: 'Motors',
        units: 'ms',
        details: tk('config:firmware.grbl.1.details'),
        dataType: NUMBER,
        min: 25,
        max: 255,
        step: 5,
    },
    {
        setting: '$2',
        description: tk('config:firmware.grbl.2.description'),
        category: 'Motors',
        units: 'mask',
        details: tk('config:firmware.grbl.2.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$3',
        description: tk('config:firmware.grbl.3.description'),
        category: 'Motors',
        units: 'mask',
        details: tk('config:firmware.grbl.3.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$4',
        description: tk('config:firmware.grbl.4.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grbl.4.details'),
        dataType: SWITCH,
    },
    {
        setting: '$5',
        description: tk('config:firmware.grbl.5.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grbl.5.details'),
        dataType: SWITCH,
    },
    {
        setting: '$6',
        description: tk('config:firmware.grbl.6.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grbl.6.details'),
        dataType: SWITCH,
    },
    {
        setting: '$10',
        description: tk('config:firmware.grbl.10.description'),
        category: 'GRBL',
        units: 'mask',
        details: tk('config:firmware.grbl.10.details'),
        dataType: MASK_STATUS_REPORT,
    },
    {
        setting: '$11',
        description: tk('config:firmware.grbl.11.description'),
        category: 'GRBL',
        units: 'mm',
        details: tk('config:firmware.grbl.11.details'),
        dataType: NUMBER,
        min: 0.001,
        step: 0.001,
    },
    {
        setting: '$12',
        description: tk('config:firmware.grbl.12.description'),
        category: 'GRBL',
        units: 'mm',
        details: tk('config:firmware.grbl.12.details'),
        dataType: NUMBER,
        min: 0.001,
        step: 0.001,
    },
    {
        setting: '$13',
        description: tk('config:firmware.grbl.13.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grbl.13.details'),
        dataType: SWITCH,
    },
    {
        setting: '$20',
        description: tk('config:firmware.grbl.20.description'),
        category: 'Homing',
        units: 'boolean',
        details: tk('config:firmware.grbl.20.details'),
        dataType: SWITCH,
    },
    {
        setting: '$21',
        description: tk('config:firmware.grbl.21.description'),
        category: 'Homing',
        units: 'boolean',
        details: tk('config:firmware.grbl.21.details'),
        dataType: SWITCH,
    },
    {
        setting: '$22',
        description: tk('config:firmware.grbl.22.description'),
        category: 'Homing',
        units: 'boolean',
        details: tk('config:firmware.grbl.22.details'),
        dataType: SWITCH,
    },
    {
        setting: '$23',
        description: tk('config:firmware.grbl.23.description'),
        category: 'Homing',
        units: 'mask',
        details: tk('config:firmware.grbl.23.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$24',
        description: tk('config:firmware.grbl.24.description'),
        category: 'Homing',
        units: 'mm/min',
        details: tk('config:firmware.grbl.24.details'),
        dataType: NUMBER,
        min: 1,
        step: 1,
    },
    {
        setting: '$25',
        description: tk('config:firmware.grbl.25.description'),
        category: 'Homing',
        units: 'mm/min',
        details: tk('config:firmware.grbl.25.details'),
        dataType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$26',
        description: tk('config:firmware.grbl.26.description'),
        category: 'Homing',
        units: 'ms',
        details: tk('config:firmware.grbl.26.details'),
        dataType: NUMBER,
        min: 5,
        max: 255,
        step: 5,
    },
    {
        setting: '$27',
        description: tk('config:firmware.grbl.27.description'),
        category: 'Homing',
        units: 'mm',
        details: tk('config:firmware.grbl.27.details'),
        dataType: NUMBER,
        min: 0,
        step: 0.5,
    },
    {
        setting: '$30',
        description: tk('config:firmware.grbl.30.description'),
        category: 'Spindle',
        units: 'rpm',
        details: tk('config:firmware.grbl.30.details'),
        dataType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$31',
        description: tk('config:firmware.grbl.31.description'),
        category: 'Spindle',
        units: 'rpm',
        details: tk('config:firmware.grbl.31.details'),
        dataType: NUMBER,
        min: 1,
        step: 1,
    },
    {
        setting: '$32',
        description: tk('config:firmware.grbl.32.description'),
        category: 'Spindle',
        units: 'boolean',
        details: tk('config:firmware.grbl.32.details'),
        dataType: SWITCH,
    },
    {
        setting: '$100',
        description: tk('config:firmware.grbl.100.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grbl.100.details'),
        dataType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$101',
        description: tk('config:firmware.grbl.101.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grbl.101.details'),
        dataType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$102',
        description: tk('config:firmware.grbl.102.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grbl.102.details'),
        dataType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$110',
        description: tk('config:firmware.grbl.110.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grbl.110.details'),
        dataType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$111',
        description: tk('config:firmware.grbl.111.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grbl.111.details'),
        dataType: NUMBER,
        min: 100,
        step: 100,
    },
    {
        setting: '$112',
        description: tk('config:firmware.grbl.112.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grbl.112.details'),
        dataType: NUMBER,
        min: 10,
        step: 10,
    },
    {
        setting: '$120',
        description: tk('config:firmware.grbl.120.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grbl.120.details'),
        dataType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$121',
        description: tk('config:firmware.grbl.121.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grbl.121.details'),
        dataType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$122',
        description: tk('config:firmware.grbl.122.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grbl.122.details'),
        dataType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$130',
        description: tk('config:firmware.grbl.130.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grbl.130.details'),
        dataType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$131',
        description: tk('config:firmware.grbl.131.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grbl.131.details'),
        dataType: NUMBER,
        min: 1,
        step: 10,
    },
    {
        setting: '$132',
        description: tk('config:firmware.grbl.132.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grbl.132.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.3x0.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x0.details'),
        dataType: STRING,
        maxChars: 32,
    },
    {
        // TODO default value
        // NEW
        setting: '$3x1',
        description: tk('config:firmware.grblhal.3x1.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x1.details'),
        dataType: SELECT,
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
        description: tk('config:firmware.grblhal.3x2.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x2.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // TODO not sure about max
        // NEW
        setting: '$3x3',
        description: tk('config:firmware.grblhal.3x3.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x3.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // TODO not sure about max
        // NEW
        // default 255.255.255.0.
        setting: '$3x4',
        description: tk('config:firmware.grblhal.3x4.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x4.details'),
        dataType: STRING,
    },
    {
        // NEW
        // default value 23
        setting: '$3x5',
        description: tk('config:firmware.grblhal.3x5.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x5.details'),
        dataType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        // NEW
        // default value 80
        setting: '$3x6',
        description: tk('config:firmware.grblhal.3x6.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x6.details'),
        dataType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        // NEW
        // default value 81
        setting: '$3x7',
        description: tk('config:firmware.grblhal.3x7.description'),
        category: 'NetInterface',
        units: '',
        details: tk('config:firmware.grblhal.3x7.details'),
        dataType: NUMBER,
        min: 0,
        max: 65536,
        step: 1,
    },
    {
        setting: '$0',
        description: tk('config:firmware.grblhal.0.description'),
        category: 'Motors',
        units: 'μs',
        details: tk('config:firmware.grblhal.0.details'),
        dataType: NUMBER,
        min: 3,
        max: 12,
        step: 1,
    },
    {
        setting: '$1',
        description: tk('config:firmware.grblhal.1.description'),
        category: 'Motors',
        units: 'ms',
        details: tk('config:firmware.grblhal.1.details'),
        dataType: NUMBER,
        min: 25,
        max: 255,
        step: 5,
    },
    {
        setting: '$2',
        description: tk('config:firmware.grblhal.2.description'),
        category: 'Motors',
        units: 'mask',
        details: tk('config:firmware.grblhal.2.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$3',
        description: tk('config:firmware.grblhal.3.description'),
        category: 'Motors',
        units: 'mask',
        details: tk('config:firmware.grblhal.3.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$4',
        description: tk('config:firmware.grblhal.4.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grblhal.4.details'),
        dataType: SWITCH,
    },
    {
        setting: '$5',
        description: tk('config:firmware.grblhal.5.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grblhal.5.details'),
        dataType: SWITCH,
    },
    {
        setting: '$6',
        description: tk('config:firmware.grblhal.6.description'),
        category: 'Pins',
        units: 'boolean',
        details: tk('config:firmware.grblhal.6.details'),
        dataType: SWITCH,
    },
    {
        setting: '$8',
    },
    {
        setting: '$9',
    },
    {
        setting: '$10',
        description: tk('config:firmware.grblhal.10.description'),
        category: 'GRBL',
        units: 'mask',
        details: tk('config:firmware.grblhal.10.details'),
        dataType: MASK_STATUS_REPORT,
    },
    {
        setting: '$11',
        description: tk('config:firmware.grblhal.11.description'),
        category: 'GRBL',
        units: 'mm',
        details: tk('config:firmware.grblhal.11.details'),
        dataType: NUMBER,
        min: 0.001,
        max: 0.02,
        step: 0.001,
    },
    {
        setting: '$12',
        description: tk('config:firmware.grblhal.12.description'),
        category: 'GRBL',
        units: 'mm',
        details: tk('config:firmware.grblhal.12.details'),
        dataType: NUMBER,
        min: 0.001,
        max: 0.003,
        step: 0.001,
    },
    {
        setting: '$13',
        description: tk('config:firmware.grblhal.13.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.13.details'),
        dataType: SWITCH,
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
        description: tk('config:firmware.grblhal.20.description'),
        category: 'Homing',
        units: 'boolean',
        details: tk('config:firmware.grblhal.20.details'),
        dataType: SWITCH,
    },
    {
        // TODO
        /*
            MASK
            - bit0 - enable hard limits.
            - bit1 - enable strict mode when hard limits enabled, this bit cannot be changed when COMPATIBILITY_LEVEL > 1.
        */
        setting: '$21',
        description: tk('config:firmware.grblhal.21.description'),
        category: 'Homing',
        units: 'mask',
        details: tk('config:firmware.grblhal.21.details'),
        dataType: MASK,
        bits: {
            0: tk('config:firmware.grblhal.21.bits.0'),
            1: tk('config:firmware.grblhal.21.bits.1'),
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
        description: tk('config:firmware.grblhal.22.description'),
        category: 'Homing',
        units: 'mask',
        details: tk('config:firmware.grblhal.22.details'),
        dataType: MASK,
        bits: {
            0: tk('config:firmware.grblhal.22.bits.0'),
            1: tk('config:firmware.grblhal.22.bits.1'),
            2: tk('config:firmware.grblhal.22.bits.2'),
            3: tk('config:firmware.grblhal.22.bits.3'),
            4: tk('config:firmware.grblhal.22.bits.4'),
            5: tk('config:firmware.grblhal.22.bits.5'),
            6: tk('config:firmware.grblhal.22.bits.6'),
            7: tk('config:firmware.grblhal.22.bits.7'),
        },
        numBits: 8,
        requiredBit: 0,
    },
    {
        setting: '$23',
        description: tk('config:firmware.grblhal.23.description'),
        category: 'Homing',
        units: 'mask',
        details: tk('config:firmware.grblhal.23.details'),
        dataType: AXIS_MASK,
    },
    {
        setting: '$24',
        description: tk('config:firmware.grblhal.24.description'),
        category: 'Homing',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.24.details'),
        dataType: NUMBER,
        min: 1,
        max: 30,
        step: 1,
    },
    {
        setting: '$25',
        description: tk('config:firmware.grblhal.25.description'),
        category: 'Homing',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.25.details'),
        dataType: NUMBER,
        min: 100,
        max: 1000,
        step: 100,
    },
    {
        setting: '$26',
        description: tk('config:firmware.grblhal.26.description'),
        category: 'Homing',
        units: 'ms',
        details: tk('config:firmware.grblhal.26.details'),
        dataType: NUMBER,
        min: 5,
        max: 255,
        step: 5,
    },
    {
        setting: '$27',
        description: tk('config:firmware.grblhal.27.description'),
        category: 'Homing',
        units: 'mm',
        details: tk('config:firmware.grblhal.27.details'),
        dataType: NUMBER,
        min: 0,
        max: 5,
        step: 0.5,
    },
    {
        // TODO max and default
        // NEW
        setting: '$28',
        description: tk('config:firmware.grblhal.28.description'),
        category: 'Homing',
        units: 'mm',
        details: tk('config:firmware.grblhal.28.details'),
        dataType: NUMBER,
        min: 0,
        step: 0.5,
    },
    {
        // TODO max and default
        // NEW
        setting: '$29',
        description: tk('config:firmware.grblhal.29.description'),
        category: 'Homing',
        units: 'μs',
        details: tk('config:firmware.grblhal.29.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        setting: '$30',
        description: tk('config:firmware.grblhal.30.description'),
        category: 'Spindle',
        units: 'rpm',
        details: tk('config:firmware.grblhal.30.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.31.description'),
        category: 'Spindle',
        units: '',
        details: tk('config:firmware.grblhal.31.details'),
        dataType: SELECT,
        defaultValue: 0,
        values: {
            0: 'Normal mode',
            1: 'Laser mode',
            2: 'Lathe mode',
        },
    },
    {
        setting: '$32',
        description: tk('config:firmware.grblhal.32.description'),
        category: 'Spindle',
        units: 'boolean',
        details: tk('config:firmware.grblhal.32.details'),
        dataType: SWITCH,
    },
    {
        // TODO default
        // NEW
        setting: '$33',
        description: tk('config:firmware.grblhal.33.description'),
        category: 'Spindle',
        units: 'Hz',
        details: tk('config:firmware.grblhal.33.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$34',
        description: tk('config:firmware.grblhal.34.description'),
        category: 'Spindle',
        units: '%',
        details: tk('config:firmware.grblhal.34.details'),
        dataType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$35',
        description: tk('config:firmware.grblhal.35.description'),
        category: 'Spindle',
        units: '%',
        details: tk('config:firmware.grblhal.35.details'),
        dataType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$36',
        description: tk('config:firmware.grblhal.36.description'),
        category: 'Spindle',
        units: '%',
        details: tk('config:firmware.grblhal.36.details'),
        dataType: NUMBER,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // NEW
        setting: '$37',
        description: tk('config:firmware.grblhal.37.description'),
        category: 'Spindle',
        units: '%',
        details: tk('config:firmware.grblhal.37.details'),
        dataType: AXIS_MASK,
        min: 1,
        max: 100,
        step: 1,
    },
    {
        // TODO max
        // NEW
        setting: '$38',
        description: tk('config:firmware.grblhal.38.description'),
        category: 'Spindle',
        units: '/revolution',
        details: tk('config:firmware.grblhal.38.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.39.description'),
        category: 'Spindle',
        units: 'boolean',
        details: tk('config:firmware.grblhal.39.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        setting: '$40',
        description: tk('config:firmware.grblhal.40.description'),
        category: 'Motors',
        units: 'boolean',
        details: tk('config:firmware.grblhal.40.details'),
        dataType: SWITCH,
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
        description: tk('config:firmware.grblhal.43.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.43.details'),
        dataType: NUMBER,
        min: 0,
        max: 255,
        step: 1,
    },
    {
        // NEW
        setting: '$44',
        description: tk('config:firmware.grblhal.44.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.44.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$45',
        description: tk('config:firmware.grblhal.45.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.45.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$46',
        description: tk('config:firmware.grblhal.46.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.46.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$47',
        description: tk('config:firmware.grblhal.47.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.47.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$48',
        description: tk('config:firmware.grblhal.48.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.48.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$49',
        description: tk('config:firmware.grblhal.49.description'),
        category: 'Homing',
        units: '',
        details: tk('config:firmware.grblhal.49.details'),
        dataType: AXIS_MASK,
    },
    {
        // NEW
        setting: '$50',
        description: tk('config:firmware.grblhal.50.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.50.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$51',
        description: tk('config:firmware.grblhal.51.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.51.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$52',
        description: tk('config:firmware.grblhal.52.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.52.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$53',
        description: tk('config:firmware.grblhal.53.description'),
        category: 'Motors',
        units: 'mm',
        details: tk('config:firmware.grblhal.53.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$54',
        description: tk('config:firmware.grblhal.54.description'),
        category: 'Motors',
        units: 'mm',
        details: tk('config:firmware.grblhal.54.details'),
        dataType: NUMBER,
        min: 1,
        max: 10000,
        step: 1,
    },
    {
        // NEW
        setting: '$55',
        description: tk('config:firmware.grblhal.55.description'),
        category: 'Motors',
        units: 'mm',
        details: tk('config:firmware.grblhal.55.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.60.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.60.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$61',
        description: tk('config:firmware.grblhal.61.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.61.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$62',
        description: tk('config:firmware.grblhal.62.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.62.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        // default 0 (on)
        setting: '$63',
        description: tk('config:firmware.grblhal.63.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.63.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$64',
        description: tk('config:firmware.grblhal.64.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.64.details'),
        dataType: SWITCH,
    },
    {
        // NEW
        // default 0 (off)
        setting: '$65',
        description: tk('config:firmware.grblhal.65.description'),
        category: 'GRBL',
        units: 'boolean',
        details: tk('config:firmware.grblhal.65.details'),
        dataType: SWITCH,
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
        description: tk('config:firmware.grblhal.70.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.70.details'),
        dataType: MASK,
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
        description: tk('config:firmware.grblhal.71.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.71.details'),
        dataType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default "GRBL serial port"
        setting: '$72',
        description: tk('config:firmware.grblhal.72.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.72.details'),
        dataType: STRING,
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
        description: tk('config:firmware.grblhal.73.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.73.details'),
        dataType: SELECT,
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
        description: tk('config:firmware.grblhal.74.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.74.details'),
        dataType: STRING,
        maxChars: 64,
    },
    {
        // NEW
        // default empty
        setting: '$75',
        description: tk('config:firmware.grblhal.75.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.75.details'),
        dataType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default empty
        setting: '$76',
        description: tk('config:firmware.grblhal.76.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.76.details'),
        dataType: STRING,
        maxChars: 64,
    },
    {
        // TODO default
        // NEW
        // default provided by driver. blank = AP is "Open"
        setting: '$77',
        description: tk('config:firmware.grblhal.77.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.77.details'),
        dataType: STRING,
        maxChars: 32,
    },
    {
        // NEW
        // default empty
        setting: '$78',
        description: tk('config:firmware.grblhal.78.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.78.details'),
        dataType: STRING,
        maxChars: 3,
    },
    {
        // NEW
        // default 0
        setting: '$79',
        description: tk('config:firmware.grblhal.79.description'),
        category: 'Network',
        units: '',
        details: tk('config:firmware.grblhal.79.details'),
        dataType: NUMBER,
        min: 0,
        max: 11,
        step: 1,
    },
    {
        // TODO default
        // NEW
        setting: '$80',
        description: tk('config:firmware.grblhal.80.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.80.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$81',
        description: tk('config:firmware.grblhal.81.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.81.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$82',
        description: tk('config:firmware.grblhal.82.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.82.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$84',
        description: tk('config:firmware.grblhal.84.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.84.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$85',
        description: tk('config:firmware.grblhal.85.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.85.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$90',
        description: tk('config:firmware.grblhal.90.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.90.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$91',
        description: tk('config:firmware.grblhal.91.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.91.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        // NEW
        setting: '$92',
        description: tk('config:firmware.grblhal.92.description'),
        category: 'PID',
        units: '',
        details: tk('config:firmware.grblhal.92.details'),
        dataType: NUMBER,
        min: 0,
        step: 1,
    },
    {
        setting: '$100',
        description: tk('config:firmware.grblhal.100.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grblhal.100.details'),
        dataType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$101',
        description: tk('config:firmware.grblhal.101.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grblhal.101.details'),
        dataType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$102',
        description: tk('config:firmware.grblhal.102.description'),
        category: 'Motors',
        units: 'step/mm',
        details: tk('config:firmware.grblhal.102.details'),
        dataType: NUMBER,
        min: 10,
        max: 500,
        step: 10,
    },
    {
        setting: '$110',
        description: tk('config:firmware.grblhal.110.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.110.details'),
        dataType: NUMBER,
        min: 100,
        max: 1500,
        step: 100,
    },
    {
        setting: '$111',
        description: tk('config:firmware.grblhal.111.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.111.details'),
        dataType: NUMBER,
        min: 100,
        max: 1500,
        step: 100,
    },
    {
        setting: '$112',
        description: tk('config:firmware.grblhal.112.description'),
        category: 'Motors',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.112.details'),
        dataType: NUMBER,
        min: 10,
        max: 1000,
        step: 10,
    },
    {
        setting: '$120',
        description: tk('config:firmware.grblhal.120.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grblhal.120.details'),
        dataType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$121',
        description: tk('config:firmware.grblhal.121.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grblhal.121.details'),
        dataType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$122',
        description: tk('config:firmware.grblhal.122.description'),
        category: 'Motors',
        units: 'mm/sec^2',
        details: tk('config:firmware.grblhal.122.details'),
        dataType: NUMBER,
        min: 1,
        max: 15,
        step: 1,
    },
    {
        setting: '$130',
        description: tk('config:firmware.grblhal.130.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grblhal.130.details'),
        dataType: NUMBER,
        min: 1,
        max: 1500,
        step: 10,
    },
    {
        setting: '$131',
        description: tk('config:firmware.grblhal.131.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grblhal.131.details'),
        dataType: NUMBER,
        min: 1,
        max: 1500,
        step: 10,
    },
    {
        setting: '$132',
        description: tk('config:firmware.grblhal.132.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grblhal.132.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.340.description'),
        category: 'Limits',
        units: '%',
        details: tk('config:firmware.grblhal.340.details'),
        dataType: NUMBER,
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
        description: tk('config:firmware.grblhal.341.description'),
        category: 'Limits',
        units: '',
        details: tk('config:firmware.grblhal.341.details'),
        dataType: SELECT,
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
        description: tk('config:firmware.grblhal.342.description'),
        category: 'Limits',
        units: 'mm',
        details: tk('config:firmware.grblhal.342.details'),
        dataType: NUMBER,
        min: 0,
        step: 10,
    },
    {
        // TODO dont know max
        // NEW
        // default 25mm/min
        setting: '$343',
        description: tk('config:firmware.grblhal.343.description'),
        category: 'Limits',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.343.details'),
        dataType: NUMBER,
        min: 0,
        step: 10,
    },
    {
        // TODO dont know max
        // NEW
        // default 200mm/min
        setting: '$344',
        description: tk('config:firmware.grblhal.344.description'),
        category: 'Limits',
        units: 'mm/min',
        details: tk('config:firmware.grblhal.344.details'),
        dataType: NUMBER,
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

export const GRBL_SETTINGS_MAP = new Map(
    GRBL_SETTINGS.map((s) => [s.setting as EEPROM, s]),
);
export const GRBL_HAL_SETTINGS_MAP = new Map(
    GRBL_HAL_SETTINGS.map((s) => [s.setting as EEPROM, s]),
);
