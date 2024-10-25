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
    settings?: gSenderSetting[];
    eeprom?: gSenderEEPROMSetting[];
}

export type gSenderSettingType =
    | 'switch'
    | 'boolean'
    | 'select'
    | 'number'
    | 'text'
    | 'radio';

export interface gSenderSetting {
    label: string;
    type: gSenderSettingType;
    key: string;
    description?: string;
    options?: string[] | number[];
    unit?: string;
}

export interface gSenderEEPROMSetting {}

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
    { label: 'Probe', icon: MdTouchApp },
    { label: 'Status Lights', icon: CiLight },
    { label: 'Limits and Homing', icon: FaHome },
    { label: 'Spindle/Laser', icon: GiTargetLaser },
    { label: 'Automations', icon: FaRobot },
    { label: 'Action Buttons', icon: RxButton },
    { label: 'Accessory Outputs', icon: CiMapPin },
    { label: 'Tool Changing', icon: IoIosSwap },
    { label: 'Rotary', icon: FaArrowsSpin },
    { label: 'Customize UI', icon: MdSettingsApplications },
    { label: 'Ethernet', icon: BsEthernet },
    { label: 'Advanced Motors', icon: SiCoronaengine },
    { label: 'More Settings', icon: MdOutlineReadMore },
    { label: 'About', icon: CiCircleInfo },
];
