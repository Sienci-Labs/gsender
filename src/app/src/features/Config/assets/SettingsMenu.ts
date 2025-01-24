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
    settings?: gSenderSubSection[];
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
    eID?: string;
    globalIndex?: number;
    value?: gSenderSettingsValues;
    defaultValue?: any;
    dirty?: boolean;
}

export interface gSenderSubSection {
    label?: string;
    settings?: gSenderSetting[];
}

export type gSenderSettings = gSenderSetting | gSenderSubSection;
export type gSenderEEEPROMSettings = gSenderEEPROMSettingSection[];

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
                label: '',
                settings: [
                    {
                        label: 'Preferred Units',
                        key: 'workspace.units',
                        type: 'radio',
                        description:
                            'What units would you like gSender to show you?',
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
                        description:
                            'Useful if you tend to set zero accidentally',
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
                        description:
                            'Allow gSender to collect your data periodically',
                        type: 'boolean',
                    },
                ],
            },
        ],
    },
    {
        label: 'Motors',
        icon: PiEngine,
        eeprom: [
            {
                label: 'Motors',
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
        ],
    },
    {
        label: 'Probe',
        icon: MdTouchApp,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Touch Plate Type',
                        key: 'widgets.probe.probeType',
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
            },
        ],
        eeprom: [
            {
                label: 'Probe',
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
        ],
    },
    {
        label: 'Status Lights',
        icon: CiLight,
        eeprom: [
            {
                label: 'Status Lights',
                eeprom: [
                    {
                        eId: '$664',
                    },
                    {
                        eId: '$665',
                    },
                ],
            },
        ],
    },
    {
        label: 'Limits and Homing',
        icon: FaHome,
        eeprom: [
            {
                label: 'Limits and Homing',
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
                ],
            },
            {
                label: 'Homing Plan',
                eeprom: [
                    {
                        eId: '$23',
                    },
                    {
                        eId: '$43',
                    },
                    {
                        eId: '$44',
                    },
                    {
                        eId: '$45',
                    },
                    {
                        eId: '$46',
                    },
                    {
                        eId: '$47',
                    },
                    {
                        eId: '$25',
                    },
                    {
                        eId: '$190',
                    },
                    {
                        eId: '$191',
                    },
                    {
                        eId: '$192',
                    },
                    {
                        eId: '$24',
                    },
                    {
                        eId: '$180',
                    },
                    {
                        eId: '$181',
                    },
                    {
                        eId: '$182',
                    },
                    {
                        eId: '$183',
                    },
                    {
                        eId: '$26',
                    },
                    {
                        eId: '$27',
                    },
                ],
            },
        ],
    },
    {
        label: 'Spindle/Laser',
        icon: GiTargetLaser,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Delay after start',
                        key: 'workspace.spindleDelay',
                        description:
                            'Delays all jobs at the start to give time for the spindle to spin up ($392)',
                        type: 'hybrid',
                        eID: '$392',
                        unit: 's',
                    },
                    {
                        label: 'Minimum Spindle Speed',
                        key: 'widgets.spindle.spindleMin',
                        description:
                            'Match this to the minimum speed your spindle is able to spin at ($31, default 7200)',
                        type: 'hybrid',
                        eID: '$31',
                        unit: 'rpm',
                    },
                    {
                        label: 'Maximum Spindle Speed',
                        key: 'widgets.spindle.spindleMax',
                        description:
                            'Match this to the maximum speed your spindle is able to spin at ($30, default 24000)',
                        type: 'hybrid',
                        eID: '$30',
                        unit: 'rpm',
                    },
                    {
                        label: 'Minimum Laser Power',
                        key: 'widgets.spindle.laser.minPower',
                        description:
                            'Match this to the settings in your laser CAM software for the minimum S word laser power ($731, default 0)',
                        type: 'hybrid',
                        eID: '$731',
                        unit: '',
                    },
                    {
                        label: 'Maximum Laser Power',
                        key: 'widgets.spindle.laser.maxPower',
                        description:
                            'Match this to the settings in your laser CAM software for the maximum S word laser power ($730, default 255)',
                        type: 'hybrid',
                        eID: '$730',
                        unit: '',
                    },
                    {
                        label: 'Laser X Offset',
                        key: 'widgets.spindle.laser.xOffset',
                        description:
                            'Offset from the spindle in the X-axis (measure this by making a mark with a sharp v-bit then moving the laser to point to the same spot, $741, default 0)',
                        type: 'hybrid',
                        eID: '$741',
                        unit: 'mm',
                    },
                    {
                        label: 'Laser Y Offset',
                        key: 'widgets.spindle.laser.yOffset',
                        description:
                            'Offset from the spindle in the Y-axis (measure this by making a mark with a sharp v-bit then moving the laser to point to the same spot, $742, default 0)',
                        type: 'hybrid',
                        eID: '$742',
                        unit: 'rpm',
                    },
                ],
            },
        ],
        eeprom: [
            {
                label: 'Spindle',
                eeprom: [
                    {
                        eId: '$32',
                    },
                    {
                        eId: '$395',
                    },
                    {
                        eId: '$511',
                    },
                    {
                        eId: '$512',
                    },
                    {
                        eId: '$513',
                    },
                    {
                        eId: '$520',
                    },
                    {
                        eId: '$521',
                    },
                    {
                        eId: '$522',
                    },
                    {
                        eId: '$523',
                    },
                ],
            },
            {
                label: 'Spindle PWM',
                eeprom: [
                    {
                        eId: '$9',
                    },
                    {
                        eId: '$16',
                    },
                    {
                        eId: '$33',
                    },
                    {
                        eId: '$34',
                    },
                    {
                        eId: '$35',
                    },
                    {
                        eId: '$36',
                    },
                ],
            },
            {
                label: 'Spindle Modbus',
                eeprom: [
                    {
                        eId: '$340',
                    },
                    {
                        eId: '$374',
                    },
                    {
                        eId: '$375',
                    },
                    {
                        eId: '$462',
                    },
                    {
                        eId: '$463',
                    },
                    {
                        eId: '$464',
                    },
                    {
                        eId: '$465',
                    },
                    {
                        eId: '$466',
                    },
                    {
                        eId: '$467',
                    },
                    {
                        eId: '$468',
                    },
                    {
                        eId: '$469',
                    },
                    {
                        eId: '$470',
                    },
                    {
                        eId: '$471',
                    },
                    {
                        eId: '$476',
                    },
                    {
                        eId: '$477',
                    },
                    {
                        eId: '$478',
                    },
                    {
                        eId: '$479',
                    },
                ],
            },
            {
                label: 'Laser',
                eeprom: [
                    {
                        eId: '$743',
                    },
                    {
                        eId: '$731',
                    },
                    {
                        eId: '$730',
                    },
                    {
                        eId: '$741',
                    },
                    {
                        eId: '$742',
                    },
                    {
                        eId: '$733',
                    },
                    {
                        eId: '$734',
                    },
                    {
                        eId: '$735',
                    },
                    {
                        eId: '$736',
                    },
                ],
            },
        ],
    },
    { label: 'Automations', icon: FaRobot },
    {
        label: 'Action Buttons',
        icon: RxButton,
        eeprom: [
            {
                label: 'Action',
                eeprom: [
                    { eId: '$450' },
                    { eId: '$451' },
                    { eId: '$452' },
                    { eId: '$453' },
                    { eId: '$454' },
                    { eId: '$455' },
                ],
            },
        ],
    },
    {
        label: 'Accessory Outputs',
        icon: CiMapPin,
        eeprom: [
            {
                label: 'Accessories',
                eeprom: [
                    { eId: '$456' },
                    { eId: '$457' },
                    { eId: '$458' },
                    { eId: '$459' },
                ],
            },
        ],
    },
    { label: 'Tool Changing', icon: IoIosSwap },
    {
        label: 'Rotary',
        icon: FaArrowsSpin,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Resolution',
                        key: 'workspace.rotaryAxis.firmwareSettings.$101',
                        description:
                            'Travel resolution in steps per degree ($103, default 19.75308642)',
                        type: 'hybrid',
                        eID: '$103',
                        unit: 'rpm',
                    },
                    {
                        label: 'Max Speed',
                        key: 'workspace.rotaryAxis.firmwareSettings.$111',
                        description:
                            'Used for motion planning to not exceed motor torque and lose steps ($123, default 1000)',
                        type: 'hybrid',
                        eID: '$113',
                        unit: 'rpm',
                    },
                    {
                        label: 'Force Hard Limits',
                        key: '',
                        description:
                            'Updates hard limits when toggling into rotary mode',
                        type: 'boolean',
                    },
                    {
                        label: 'Force Soft Limits',
                        key: '',
                        description:
                            'Updates soft limits when toggling into rotary mode',
                        type: 'boolean',
                    },
                ],
            },
        ],
        eeprom: [
            {
                label: 'Rotary',
                eeprom: [{ eId: '$376' }, { eId: '$123' }],
            },
        ],
    },
    {
        label: 'Customize UI',
        icon: MdSettingsApplications,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'DRO Zeros',
                        key: 'workspace.customDecimalPlaces',
                        description:
                            'Default 0 (shows 2 decimal places for mm and 3 for inches) - Set between 1-5 to change the number of decimal places shown',
                        type: 'number',
                    },
                ],
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
                label: '',
                settings: [
                    {
                        label: 'IP Address',
                        key: 'widgets.connection.ip',
                        description:
                            'Set the IP address for network scanning (default 192.168.5.1)',
                        type: 'ip',
                    },
                ],
            },
        ],
        eeprom: [
            {
                label: 'Ethernet',
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
        ],
    },
    {
        label: 'Advanced Motors',
        icon: SiCoronaengine,
        eeprom: [
            {
                label: 'Advanced Motors',
                eeprom: [
                    { eId: '$0' },
                    { eId: '$1' },
                    { eId: '$2' },
                    { eId: '$4' },
                    { eId: '$29' },
                    { eId: '$140' },
                    { eId: '$141' },
                    { eId: '$142' },
                    { eId: '$143' },
                    { eId: '$200' },
                    { eId: '$201' },
                    { eId: '$202' },
                    { eId: '$203' },
                    { eId: '$210' },
                    { eId: '$211' },
                    { eId: '$212' },
                    { eId: '$213' },
                    { eId: '$220' },
                    { eId: '$221' },
                    { eId: '$222' },
                    { eId: '$223' },
                    { eId: '$338' },
                    { eId: '$339' },
                    { eId: '$650' },
                    { eId: '$651' },
                    { eId: '$652' },
                    { eId: '$653' },
                    { eId: '$654' },
                    { eId: '$655' },
                    { eId: '$656' },
                    { eId: '$657' },
                    { eId: '$658' },
                    { eId: '$659' },
                    { eId: '$660' },
                    { eId: '$661' },
                    { eId: '$662' },
                    { eId: '$663' },
                ],
            },
        ],
    },
    {
        label: 'More Settings',
        icon: MdOutlineReadMore,
        eeprom: [
            {
                label: 'More Settings',
                eeprom: [
                    { eId: '$10' },
                    { eId: '$11' },
                    { eId: '$12' },
                    { eId: '$13' },
                    { eId: '$14' },
                    { eId: '$15' },
                    { eId: '$17' },
                    { eId: '$18' },
                    { eId: '$19' },
                    { eId: '$28' },
                    { eId: '$39' },
                    { eId: '$41' },
                    { eId: '$42' },
                    { eId: '$56' },
                    { eId: '$57' },
                    { eId: '$58' },
                    { eId: '$60' },
                    { eId: '$61' },
                    { eId: '$63' },
                    { eId: '$64' },
                    { eId: '$65' },
                    { eId: '$341' },
                    { eId: '$342' },
                    { eId: '$343' },
                    { eId: '$344' },
                    { eId: '$345' },
                    { eId: '$346' },
                    { eId: '$370' },
                    { eId: '$372' },
                    { eId: '$384' },
                    { eId: '$393' },
                    { eId: '$398' },
                    { eId: '$481' },
                    { eId: '$484' },
                    { eId: '$486' },
                    { eId: '$666' },
                ],
            },
        ],
    },
];
