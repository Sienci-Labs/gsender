import { BsEthernet } from 'react-icons/bs';
import { FaCog } from 'react-icons/fa';
import { PiEngine } from 'react-icons/pi';
import { MdTouchApp } from 'react-icons/md';
import { CiLight } from 'react-icons/ci';
import { FaHome } from 'react-icons/fa';
import { GiTargetLaser } from 'react-icons/gi';
import { FaRobot } from 'react-icons/fa';
import { RxButton } from 'react-icons/rx';
import { CiMapPin } from 'react-icons/ci';
import { IoIosSwap } from 'react-icons/io';
import { FaArrowsSpin } from 'react-icons/fa6';
import { MdSettingsApplications } from 'react-icons/md';
import { SiCoronaengine } from 'react-icons/si';
import { MdOutlineReadMore } from 'react-icons/md';
import { CiCircleInfo } from 'react-icons/ci';

export interface SettingsMenuSection {
    label: string;
    icon: (props) => JSX.Element;
    settings?: gSenderSettings[];
    eeprom?: gSenderEEEPROMSettings;
}

export type gSenderSettingType =
    | 'switch'
    | 'boolean'
    | 'select'
    | 'number'
    | 'text'
    | 'radio'
    | 'ip'
    | 'hybrid';

export type gSenderSettingsValues = number | string | boolean;

export interface gSenderSetting {
    label: string;
    type: gSenderSettingType;
    key: string;
    description?: string;
    options?: string[] | number[];
    unit?: string;
    value?: gSenderSettingsValues;
}

export interface gSenderSubSection {
    label: string;
    settings: gSenderSetting[];
}

export type gSenderSettings = gSenderSetting | gSenderSubSection;
export type gSenderEEEPROMSettings =
    | gSenderEEPROMSetting[]
    | gSenderEEPROMSettingSection;

export interface gSenderEEPROMSetting {
    eId: string;
    value?: gSenderSettingsValues;
    defaultValue?: gSenderSettingsValues;
    description?: string;
    details?: string;
    unit?: string;
    format?: string;
    dataType?: number;
    group?: number;
}

export interface gSenderEEPROMSettingSection {
    label: string;
    eeprom: gSenderEEPROMSetting[];
}

export const SettingsMenu: SettingsMenuSection[] = [
    {
        label: 'Basics',
        icon: FaCog,
        settings: [
            {
                label: 'Preferred Units',
                key: 'workspace.units',
                type: 'radio',
                description: 'What units would you like gSender to show you?',
                options: ['mm', 'in'],
            },
            {
                label: 'Baudrate',
                key: 'widgets.connection.baudrate',
                type: 'select',
                description:
                    'Rate needed for your particular CNC (how fast data is sent over the serial line, default 115200)',
                options: [
                    '250000',
                    '115200',
                    '57600',
                    '38400',
                    '19200',
                    '9600',
                    '2400',
                ],
            },
            {
                label: 'Reconnect Automatically',
                key: 'widgets.connection.autoReconnect',
                type: 'boolean',
                description:
                    'Reconnect to the last machine you used automatically',
            },
            {
                label: 'Warn if bad file',
                key: 'widgets.visualizer.showWarning',
                description:
                    'Warns if any invalid commands are found when a file is opened',
                type: 'boolean',
            },
            {
                label: 'Warn on bad line',
                key: 'widgets.visualizer.showLineWarnings',
                description:
                    'Warns when running a job if any invalid commands are found',
                type: 'boolean',
            },
            {
                label: 'Prompt when setting zero',
                key: 'widgets.visualizer.showSoftLimitWarning',
                description: 'Useful if you tend to set zero accidentally',
                type: 'boolean',
            },
            {
                label: 'Safe Height',
                key: 'workspace.safeRetractHeight',
                type: 'number',
                description:
                    "Amount Z-axis will move up from its current position before making an X/Y/A movement (only for gotos and quick-movements in gSender, doesn't apply to files, if homing is enabled this value becomes the offset from the top of the Z-axis, default 0)",
            },
            {
                label: 'Send Usage Data',
                key: '',
                description: 'Allow gSender to collect your data periodically',
                type: 'boolean',
            },
        ],
    },
    {
        label: 'Motors',
        icon: PiEngine,
        eeprom: [
            {
                eId: '$3',
            },
            {
                eId: '$100',
            },
            {
                eId: '$150',
            },
            {
                eId: '$110',
            },
            {
                eId: '$120',
            },
            {
                eId: '$150',
            },
        ],
    },
    {
        label: 'Probe',
        icon: MdTouchApp,
        settings: [
            {
                label: 'Touch Plate Type',
                key: 'widgets.connection.baudrate',
                type: 'select',
                description:
                    "Select the touch plate you're using with your machine (default Standard block)",
                options: ['Standard', 'Auto', 'Z Probe'],
            },
            {
                label: 'Z Thickness',
                key: 'workspace.probeProfile.zThickness',
                description:
                    'Measure the plate thickness where the cutting tool will touch off when probing the Z-axis (default 15)',
                type: 'number',
            },
            {
                label: 'XY Thickness',
                key: 'workspace.probeProfile.xyThickness',
                description:
                    'Measure the plate thickness where the cutting tool will touch off when probing the X and Y axes (default 10)',
                type: 'number',
            },
            {
                label: 'Z Probe Distance',
                key: 'widgets.probe.zProbeDistance',
                description:
                    'How far to travel in Z until it gives up on probing, if you get an alarm 2 for soft limits when probing then reduce this value (default 30)',
                type: 'number',
            },
            {
                label: 'Fast Find',
                key: 'widgets.probe.probeFastFeedrate',
                description:
                    'Probe speed before the first touch-off (default 150)',
                type: 'number',
            },
            {
                label: 'Slow Find',
                key: 'widgets.probe.probeFeedrate',
                description:
                    'Slower speed for more accuracy on second touch-off (default 75)',
                type: 'number',
            },
            {
                label: 'Retraction',
                key: 'widgets.probe.retractionDistance',
                description:
                    'How far the probe moves away after a successful touch (default 4)',
                type: 'number',
            },
            {
                label: 'Probe Connection Test',
                key: 'widgets.probe.connectivityTest',
                description:
                    'A safe check to make sure your probe is connected correctly',
                type: 'boolean',
            },
        ],
        eeprom: [
            {
                eId: '$6',
            },
            {
                eId: '$668',
            },
            {
                eId: '$',
            },
        ],
    },
    {
        label: 'Status Lights',
        icon: CiLight,
        eeprom: [
            {
                eId: '$664',
            },
            {
                eId: '$665',
            },
        ],
    },
    {
        label: 'Limits and Homing',
        icon: FaHome,
        eeprom: [
            {
                eId: '$5',
            },
            {
                eId: '$22',
            },
            {
                eId: '$130',
            },
            {
                eId: '$131',
            },
            {
                eId: '$132',
            },
            {
                eId: '$133',
            },
            {
                eId: '$20',
            },
            {
                eId: '$40',
            },
            {
                eId: '$21',
            },
            {
                eId: '$22',
            },
        ],
    },
    {
        label: 'Spindle/Laser',
        icon: GiTargetLaser,
        settings: [
            {
                label: 'Enable',
                key: '',
                description: '',
                type: 'boolean',
            },
            {
                label: 'Delay after start',
                key: '',
                description: '',
                type: 'number',
                unit: 's',
            },
            {
                label: 'Minimum Spindle Speed',
                key: '',
                description: '',
                type: 'number',
                unit: 'rpm',
            },
            {
                label: 'Maximum Spindle Speed',
                key: '',
                description: '',
                type: 'boolean',
                unit: 'rpm',
            },
            {
                label: '',
                key: '',
                description: '',
                type: 'boolean',
            },
        ],
    },
    { label: 'Automations', icon: FaRobot },
    {
        label: 'Action Buttons',
        icon: RxButton,
        eeprom: [
            { eId: '$450' },
            { eId: '$451' },
            { eId: '$452' },
            { eId: '$453' },
            { eId: '$454' },
            { eId: '$455' },
        ],
    },
    {
        label: 'Accessory Outputs',
        icon: CiMapPin,
        eeprom: [
            { eId: '$456' },
            { eId: '$457' },
            { eId: '$458' },
            { eId: '$459' },
        ],
    },
    { label: 'Tool Changing', icon: IoIosSwap },
    {
        label: 'Rotary',
        icon: FaArrowsSpin,
        eeprom: [
            { eId: '$376' },
            { eId: '$376' },
            { eId: '$103' },
            { eId: '$113' },
            { eId: '$123' },
        ],
    },
    {
        label: 'Customize UI',
        icon: MdSettingsApplications,
        settings: [
            {
                label: 'DRO Zeros',
                key: 'workspace.customDecimalPlaces',
                description:
                    'Default 0 (shows 2 decimal places for mm and 3 for inches) - Set between 1-5 to change the number of decimal places shown',
                type: 'number',
            },
            {
                label: 'Jogging Presets',
                settings: [],
            },
            {
                label: 'Visualizer',
                settings: [
                    {
                        label: 'Visualize g-code',
                        key: 'widgets.visualizer.disabled',
                        description:
                            'Only disable if your computer is struggling to run gSender',
                        type: 'boolean',
                    },
                    {
                        label: 'Theme',
                        key: 'widgets.visualizer.theme',
                        description: '',
                        type: 'select',
                        options: ['Light', 'Dark'],
                    },
                    {
                        label: 'Animate tool',
                        key: 'widgets.visualizer.minimizeRenders',
                        description:
                            'Based on preference, reduces some memory usage',
                        type: 'boolean',
                    },
                    {
                        label: 'Lightweight mode',
                        key: 'widgets.visualizer.liteMode',
                        description:
                            'Useful in cases where one-off files are slowing down your computer, choose how much of the visualizer you want to disable to keep gSender running smoothly',
                        type: 'boolean',
                    },
                ],
            },
        ],
    },
    {
        label: 'Ethernet',
        icon: BsEthernet,
        settings: [
            {
                label: 'IP Address',
                key: 'widgets.connection.ip',
                description:
                    'Set the IP address for network scanning (default 192.168.5.1)',
                type: 'ip',
            },
        ],
        eeprom: [
            { eId: '$301' },
            { eId: '$302' },
            { eId: '$303' },
            { eId: '$304' },
            { eId: '$70' },
            { eId: '$300' },
            { eId: '$305' },
            { eId: '$307' },
            { eId: '$308' },
        ],
    },
    { label: 'Advanced Motors', icon: SiCoronaengine },
    { label: 'More Settings', icon: MdOutlineReadMore },
    { label: 'About', icon: CiCircleInfo },
];
