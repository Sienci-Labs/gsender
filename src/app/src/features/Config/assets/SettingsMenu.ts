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
import { IconType } from 'react-icons';
import {
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_ZERO,
} from 'app/lib/constants';
import React from 'react';
import { AJogWizard } from 'app/features/Config/components/wizards/AJogWizard.tsx';
import { ProbePinStatus } from 'app/features/Config/components/wizards/ProbePinStatus.tsx';
import { LimitSwitchIndicators } from 'app/features/Config/components/wizards/LimitSwitchIndicators.tsx';
import { SpindleWizard } from 'app/features/Config/components/wizards/SpindleWizard.tsx';
import { AccessoryOutputWizard } from 'app/features/Config/components/wizards/AccessoryOutputWizard.tsx';
import { SquaringToolWizard } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';
import { XJogWizard } from 'app/features/Config/components/wizards/XJogWizard.tsx';
import { YJogWizard } from 'app/features/Config/components/wizards/YJogWizard.tsx';
import { ZJogWizard } from 'app/features/Config/components/wizards/ZJogWizard.tsx';

export interface SettingsMenuSection {
    label: string;
    icon: IconType;
    settings?: gSenderSubSection[];
    eeprom?: gSenderEEEPROMSettings;
    wizard?: () => JSX.Element;
}

export type gSenderSettingType =
    | 'switch'
    | 'boolean'
    | 'select'
    | 'number'
    | 'text'
    | 'radio'
    | 'ip'
    | 'hybrid'
    | 'eeprom'
    | 'event'
    | 'textarea'
    | 'wizard';

export type gSenderSettingsValues = number | string | boolean;

export interface gSenderSetting {
    label?: string;
    type: gSenderSettingType;
    key?: string;
    description?: string;
    options?: string[] | number[];
    unit?: string;
    eID?: string;
    globalIndex?: number;
    value?: gSenderSettingsValues;
    defaultValue?: any;
    dirty?: boolean;
    eventType?: string;
    wizard?: () => JSX.Element;
    toolLink?: string;
    toolLinkLabel?: string;
}

export interface gSenderSubSection {
    label?: string;
    wizard?: () => JSX.Element;
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
    toolLink?: string;
    toolLinkLabel?: string;
}

export interface gSenderEEPROMSettingSection {
    label: string;
    wizard?: () => JSX.Element;
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
                    {
                        type: 'eeprom',
                        eID: '',
                    },
                ],
            },
        ],
    },
    {
        label: 'Motors',
        icon: PiEngine,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'wizard',
                        wizard: SquaringToolWizard,
                        label: 'Square up CNC rails',
                        description:
                            'Misaligned rails can cause 90 degree cuts to come out skewed, use the wizard to fix this.',
                    },
                    {
                        type: 'eeprom',
                        eID: '$3',
                    },
                    {
                        type: 'eeprom',
                        eID: '$37',
                    },
                ],
            },
            {
                label: 'X-axis',
                wizard: XJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$100',
                        toolLink: 'Tune Correction',
                        toolLinkLabel: '/movement-tuning',
                    },
                    {
                        type: 'eeprom',
                        eID: '$150',
                    },
                    {
                        type: 'eeprom',
                        eID: '$110',
                    },
                    {
                        type: 'eeprom',
                        eID: '$120',
                    },
                ],
            },
            {
                label: 'Y-axis',
                wizard: YJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$8',
                    },
                    {
                        type: 'eeprom',
                        eID: '$101',
                        toolLink: 'Tune Correction',
                        toolLinkLabel: '/movement-tuning',
                    },
                    {
                        type: 'eeprom',
                        eID: '$151',
                    },
                    {
                        type: 'eeprom',
                        eID: '$111',
                    },
                    {
                        type: 'eeprom',
                        eID: '$121',
                    },
                ],
            },
            {
                label: 'Z-axis',
                wizard: ZJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$102',
                        toolLink: 'Tune Correction',
                        toolLinkLabel: '/movement-tuning',
                    },
                    {
                        type: 'eeprom',
                        eID: '$152',
                    },
                    {
                        type: 'eeprom',
                        eID: '$112',
                    },
                    {
                        type: 'eeprom',
                        eID: '$122',
                    },
                ],
            },
        ],
    },
    {
        label: 'Probe',
        icon: MdTouchApp,
        wizard: ProbePinStatus,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$6',
                    },
                    {
                        type: 'eeprom',
                        eID: '$668',
                    },
                    {
                        label: 'Touch Plate Type',
                        key: 'workspace.probeProfile.touchplateType',
                        type: 'select',
                        description:
                            "Select the touch plate you're using with your machine (default Standard block)",
                        options: [
                            TOUCHPLATE_TYPE_STANDARD,
                            TOUCHPLATE_TYPE_AUTOZERO,
                            TOUCHPLATE_TYPE_ZERO,
                        ],
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
    },
    {
        label: 'Status Lights',
        icon: CiLight,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$664',
                    },
                    {
                        type: 'eeprom',
                        eID: '$665',
                    },
                ],
            },
        ],
    },
    {
        label: 'Homing/Limits',
        icon: FaHome,
        wizard: LimitSwitchIndicators,
        settings: [
            {
                label: 'Limits and Homing',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$5',
                    },
                    {
                        type: 'eeprom',
                        eID: '$22',
                    },
                    {
                        type: 'eeprom',
                        eID: '$130',
                    },
                    {
                        type: 'eeprom',
                        eID: '$131',
                    },
                    {
                        type: 'eeprom',
                        eID: '$132',
                    },
                    {
                        type: 'eeprom',
                        eID: '$133',
                    },
                    {
                        type: 'eeprom',
                        eID: '$20',
                    },
                    {
                        type: 'eeprom',
                        eID: '$40',
                    },
                    {
                        type: 'eeprom',
                        eID: '$21',
                    },
                ],
            },
            {
                label: 'Homing Plan',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$23',
                    },
                    {
                        type: 'eeprom',
                        eID: '$43',
                    },
                    {
                        type: 'eeprom',
                        eID: '$44',
                    },
                    {
                        type: 'eeprom',
                        eID: '$45',
                    },
                    {
                        eID: '$46',
                        type: 'eeprom',
                    },
                    {
                        type: 'eeprom',
                        eID: '$47',
                    },
                    {
                        type: 'eeprom',
                        eID: '$25',
                    },
                    {
                        type: 'eeprom',
                        eID: '$190',
                    },
                    {
                        type: 'eeprom',
                        eID: '$191',
                    },
                    {
                        type: 'eeprom',
                        eID: '$192',
                    },
                    {
                        type: 'eeprom',
                        eID: '$24',
                    },
                    {
                        type: 'eeprom',
                        eID: '$180',
                    },
                    {
                        type: 'eeprom',
                        eID: '$181',
                    },
                    {
                        type: 'eeprom',
                        eID: '$182',
                    },
                    {
                        type: 'eeprom',
                        eID: '$183',
                    },
                    {
                        type: 'eeprom',
                        eID: '$26',
                    },
                    {
                        type: 'eeprom',
                        eID: '$27',
                    },
                ],
            },
        ],
    },
    {
        label: 'Spindle/Laser',
        icon: GiTargetLaser,
        wizard: SpindleWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'boolean',
                        label: 'Enable Spindle functionalities',
                        description:
                            'Enable Spindle tab and related functionalities on main user interface.',
                        key: 'workspace.spindleFunctions',
                    },
                    {
                        type: 'eeprom',
                        eID: '$32',
                    },
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
                        type: 'eeprom',
                        eID: '$395',
                    },
                    {
                        type: 'eeprom',
                        eID: '$511',
                    },
                    {
                        type: 'eeprom',
                        eID: '$512',
                    },
                    {
                        type: 'eeprom',
                        eID: '$513',
                    },
                    {
                        type: 'eeprom',
                        eID: '$520',
                    },
                    {
                        type: 'eeprom',
                        eID: '$521',
                    },
                    {
                        type: 'eeprom',
                        eID: '$522',
                    },
                    {
                        type: 'eeprom',
                        eID: '$523',
                    },
                ],
            },
            {
                label: 'Spindle PWM',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$9',
                    },
                    {
                        type: 'eeprom',
                        eID: '$16',
                    },
                    {
                        type: 'eeprom',
                        eID: '$33',
                    },
                    {
                        type: 'eeprom',
                        eID: '$34',
                    },
                    {
                        type: 'eeprom',
                        eID: '$35',
                    },
                    {
                        type: 'eeprom',
                        eID: '$36',
                    },
                ],
            },
            {
                label: 'Spindle Modbus',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$340',
                    },
                    {
                        type: 'eeprom',
                        eID: '$374',
                    },
                    {
                        type: 'eeprom',
                        eID: '$375',
                    },
                    {
                        type: 'eeprom',
                        eID: '$462',
                    },
                    {
                        type: 'eeprom',
                        eID: '$463',
                    },
                    {
                        type: 'eeprom',
                        eID: '$464',
                    },
                    {
                        type: 'eeprom',
                        eID: '$465',
                    },
                    {
                        type: 'eeprom',
                        eID: '$466',
                    },
                    {
                        type: 'eeprom',
                        eID: '$467',
                    },
                    {
                        type: 'eeprom',
                        eID: '$468',
                    },
                    {
                        type: 'eeprom',
                        eID: '$469',
                    },
                    {
                        type: 'eeprom',
                        eID: '$470',
                    },
                    {
                        type: 'eeprom',
                        eID: '$471',
                    },
                    {
                        type: 'eeprom',
                        eID: '$476',
                    },
                    {
                        type: 'eeprom',
                        eID: '$477',
                    },
                    {
                        type: 'eeprom',
                        eID: '$478',
                    },
                    {
                        type: 'eeprom',
                        eID: '$479',
                    },
                ],
            },
            {
                label: 'Laser',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$743',
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
                    {
                        type: 'eeprom',
                        eID: '$733',
                    },
                    {
                        type: 'eeprom',
                        eID: '$734',
                    },
                    {
                        type: 'eeprom',
                        eID: '$735',
                    },
                    {
                        type: 'eeprom',
                        eID: '$736',
                    },
                ],
            },
        ],
    },
    {
        label: 'Automations',
        icon: FaRobot,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'File start',
                        type: 'event',
                        eventType: 'gcode:start',
                        description:
                            'Runs when you start a job, before the file itself runs',
                    },
                    {
                        label: 'File pause',
                        type: 'event',
                        eventType: 'gcode:pause',
                        description:
                            "If you'd like to stop accessories or move out of the way when you pause during a job",
                    },
                    {
                        label: 'File resume',
                        type: 'event',
                        eventType: 'gcode:resume',
                        description:
                            'Ensure that anything you set up for File pause is undone when you resume',
                    },
                    {
                        label: 'File stop',
                        type: 'event',
                        eventType: 'gcode:stop',
                        description:
                            'A catch-all to ensure that stopped or ended jobs always safely turn everything off',
                    },
                ],
            },
        ],
    },
    {
        label: 'Action Buttons',
        icon: RxButton,
        settings: [
            {
                label: '',
                settings: [
                    { type: 'eeprom', eID: '$450' },
                    { type: 'eeprom', eID: '$451' },
                    { type: 'eeprom', eID: '$452' },
                    { type: 'eeprom', eID: '$453' },
                    { type: 'eeprom', eID: '$454' },
                    { type: 'eeprom', eID: '$455' },
                ],
            },
        ],
    },
    {
        label: 'Accessory Outputs',
        icon: CiMapPin,
        wizard: AccessoryOutputWizard,
        settings: [
            {
                label: '',
                settings: [
                    { type: 'eeprom', eID: '$456' },
                    { type: 'eeprom', eID: '$457' },
                    { type: 'eeprom', eID: '$458' },
                    { type: 'eeprom', eID: '$459' },
                ],
            },
        ],
    },
    {
        label: 'Tool Changing',
        icon: IoIosSwap,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Passthrough',
                        type: 'boolean',
                        key: 'workspace.toolChange.passthrough',
                        description:
                            'Send tool change lines as-is, assuming your CNC can properly handle M6 and T commands',
                    },
                    {
                        type: 'select',
                        label: 'Strategy',
                        description:
                            'Strategy that gSender will use to handle tool change commands *add description of currently selected strategy',
                        options: [
                            'Pause',
                            'Ignore',
                            'Standard Re-zero',
                            'Flexible Re-zero',
                            'Fixed Tool Sensor',
                            'Code',
                        ],
                        key: 'workspace.toolChangeOption',
                    },
                    {
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.preHook',
                        label: 'Before Tool Change',
                        description:
                            'When using the Code strategy, this code is run as soon as an M6 command is encountered.',
                    },
                    {
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.postHook',
                        label: 'After Tool Change',
                        description:
                            'When using the Code strategy, this code is run after a tool change is completed.',
                    },
                ],
            },
        ],
    },
    {
        label: 'Rotary',
        icon: FaArrowsSpin,
        wizard: AJogWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'boolean',
                        label: 'Enable Rotary Functionalities',
                        description:
                            'Enable Rotary tab and related functionalities on main user interface.',
                        key: 'widgets.rotary.tab.show',
                    },
                    { type: 'eeprom', eID: '$376' },
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
                    { type: 'eeprom', eID: '$123' },
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
                    { type: 'eeprom', eID: '$301' },
                    { type: 'eeprom', eID: '$302' },
                    { type: 'eeprom', eID: '$303' },
                    { type: 'eeprom', eID: '$304' },
                    { type: 'eeprom', eID: '$70' },
                    { type: 'eeprom', eID: '$300' },
                    { type: 'eeprom', eID: '$305' },
                    { type: 'eeprom', eID: '$307' },
                    { type: 'eeprom', eID: '$308' },
                ],
            },
        ],
    },
    {
        label: 'Advanced Motors',
        icon: SiCoronaengine,
        settings: [
            {
                label: '',
                settings: [
                    { type: 'eeprom', eID: '$0' },
                    { type: 'eeprom', eID: '$1' },
                    { type: 'eeprom', eID: '$2' },
                    { type: 'eeprom', eID: '$4' },
                    { type: 'eeprom', eID: '$29' },
                    { type: 'eeprom', eID: '$140' },
                    { type: 'eeprom', eID: '$141' },
                    { type: 'eeprom', eID: '$142' },
                    { type: 'eeprom', eID: '$143' },
                    { type: 'eeprom', eID: '$200' },
                    { type: 'eeprom', eID: '$201' },
                    { type: 'eeprom', eID: '$202' },
                    { type: 'eeprom', eID: '$203' },
                    { type: 'eeprom', eID: '$210' },
                    { type: 'eeprom', eID: '$211' },
                    { type: 'eeprom', eID: '$212' },
                    { type: 'eeprom', eID: '$213' },
                    { type: 'eeprom', eID: '$220' },
                    { type: 'eeprom', eID: '$221' },
                    { type: 'eeprom', eID: '$222' },
                    { type: 'eeprom', eID: '$223' },
                    { type: 'eeprom', eID: '$338' },
                    { type: 'eeprom', eID: '$339' },
                    { type: 'eeprom', eID: '$650' },
                    { type: 'eeprom', eID: '$651' },
                    { type: 'eeprom', eID: '$652' },
                    { type: 'eeprom', eID: '$653' },
                    { type: 'eeprom', eID: '$654' },
                    { type: 'eeprom', eID: '$655' },
                    { type: 'eeprom', eID: '$656' },
                    { type: 'eeprom', eID: '$657' },
                    { type: 'eeprom', eID: '$658' },
                    { type: 'eeprom', eID: '$659' },
                    { type: 'eeprom', eID: '$660' },
                    { type: 'eeprom', eID: '$661' },
                    { type: 'eeprom', eID: '$662' },
                    { type: 'eeprom', eID: '$663' },
                ],
            },
        ],
    },
    {
        label: 'More Settings',
        icon: MdOutlineReadMore,
        settings: [
            {
                label: '',
                settings: [
                    { type: 'eeprom', eID: '$10' },
                    { type: 'eeprom', eID: '$11' },
                    { type: 'eeprom', eID: '$12' },
                    { type: 'eeprom', eID: '$13' },
                    { type: 'eeprom', eID: '$14' },
                    { type: 'eeprom', eID: '$15' },
                    { type: 'eeprom', eID: '$17' },
                    { type: 'eeprom', eID: '$18' },
                    { type: 'eeprom', eID: '$19' },
                    { type: 'eeprom', eID: '$28' },
                    { type: 'eeprom', eID: '$39' },
                    { type: 'eeprom', eID: '$41' },
                    { type: 'eeprom', eID: '$42' },
                    { type: 'eeprom', eID: '$56' },
                    { type: 'eeprom', eID: '$57' },
                    { type: 'eeprom', eID: '$58' },
                    { type: 'eeprom', eID: '$60' },
                    { type: 'eeprom', eID: '$61' },
                    { type: 'eeprom', eID: '$63' },
                    { type: 'eeprom', eID: '$64' },
                    { type: 'eeprom', eID: '$65' },
                    { type: 'eeprom', eID: '$341' },
                    { type: 'eeprom', eID: '$342' },
                    { type: 'eeprom', eID: '$343' },
                    { type: 'eeprom', eID: '$344' },
                    { type: 'eeprom', eID: '$345' },
                    { type: 'eeprom', eID: '$346' },
                    { type: 'eeprom', eID: '$370' },
                    { type: 'eeprom', eID: '$372' },
                    { type: 'eeprom', eID: '$384' },
                    { type: 'eeprom', eID: '$393' },
                    { type: 'eeprom', eID: '$398' },
                    { type: 'eeprom', eID: '$481' },
                    { type: 'eeprom', eID: '$484' },
                    { type: 'eeprom', eID: '$486' },
                    { type: 'eeprom', eID: '$666' },
                ],
            },
        ],
    },
];
