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
import React from 'react';

export interface SettingsMenuSection {
    label: string;
    icon: (props) => JSX.Element;
    settings?: gSenderSettings[];
    eeprom?: gSenderEEPROMSetting[];
}

export type gSenderSettingType =
    | 'switch'
    | 'boolean'
    | 'select'
    | 'number'
    | 'text'
    | 'radio'
    | 'ip';

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
    { label: 'Motors', icon: PiEngine },
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
                key: '',
                description:
                    'Measure the plate thickness where the cutting tool will touch off when probing the Z-axis (default 15)',
                type: 'number',
            },
            {
                label: 'XY Thickness',
                key: '',
                description:
                    'Measure the plate thickness where the cutting tool will touch off when probing the X and Y axes (default 10)',
                type: 'number',
            },
            {
                label: 'Z Probe Distance',
                key: '',
                description:
                    'How far to travel in Z until it gives up on probing, if you get an alarm 2 for soft limits when probing then reduce this value (default 30)',
                type: 'number',
            },
            {
                label: 'Fast Find',
                key: '',
                description:
                    'Probe speed before the first touch-off (default 150)',
                type: 'number',
            },
            {
                label: 'Slow Find',
                key: '',
                description:
                    'Slower speed for more accuracy on second touch-off (default 75)',
                type: 'number',
            },
            {
                label: 'Retraction',
                key: '',
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
    { label: 'Status Lights', icon: CiLight },
    { label: 'Limits and Homing', icon: FaHome },
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
    { label: 'Action Buttons', icon: RxButton },
    { label: 'Accessory Outputs', icon: CiMapPin },
    { label: 'Tool Changing', icon: IoIosSwap },
    { label: 'Rotary', icon: FaArrowsSpin },
    {
        label: 'Customize UI',
        icon: MdSettingsApplications,
        settings: [
            {
                label: 'DRO Zeros',
                key: '',
                description:
                    'Default 0 (shows 2 decimal places for mm and 3 for inches) - Set between 1-5 to change the number of decimal places shown',
                type: 'boolean',
            },
            {
                label: 'Jogging Presets',
                settings: [],
            },
            {
                label: 'Visualizer',
                settings: [
                    {
                        label: 'Visualizer on right side',
                        key: '',
                        description: '',
                        type: 'boolean',
                    },
                    {
                        label: 'Theme',
                        key: '',
                        description: '',
                        type: 'select',
                    },
                    {
                        label: 'Visualize g-code',
                        key: '',
                        description: '',
                        type: 'boolean',
                    },
                    {
                        label: 'Animate tool',
                        key: '',
                        description: '',
                        type: 'boolean',
                    },
                    {
                        label: 'Lightweight mode',
                        key: '',
                        description: '',
                        type: 'select',
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
                key: '',
                description:
                    'Set the IP address for network scanning (default 192.168.5.1)',
                type: 'ip',
            },
        ],
    },
    { label: 'Advanced Motors', icon: SiCoronaengine },
    { label: 'More Settings', icon: MdOutlineReadMore },
    { label: 'About', icon: CiCircleInfo },
];
