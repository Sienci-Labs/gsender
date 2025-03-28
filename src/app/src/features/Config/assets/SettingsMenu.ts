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
import { IoIosSwap, IoMdMove } from 'react-icons/io';
import { FaArrowsSpin } from 'react-icons/fa6';
import { MdSettingsApplications } from 'react-icons/md';
import { SiCoronaengine } from 'react-icons/si';
import { MdOutlineReadMore } from 'react-icons/md';
import { IconType } from 'react-icons';
import {
    PROBE_TYPE_AUTO,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_ZERO,
} from 'app/lib/constants';
import { AJogWizard } from 'app/features/Config/components/wizards/AJogWizard.tsx';
import { ProbePinStatus } from 'app/features/Config/components/wizards/ProbePinStatus.tsx';
import { LimitSwitchIndicators } from 'app/features/Config/components/wizards/LimitSwitchIndicators.tsx';
import { SpindleWizard } from 'app/features/Config/components/wizards/SpindleWizard.tsx';
import { AccessoryOutputWizard } from 'app/features/Config/components/wizards/AccessoryOutputWizard.tsx';
import { SquaringToolWizard } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';
import { XJogWizard } from 'app/features/Config/components/wizards/XJogWizard.tsx';
import { YJogWizard } from 'app/features/Config/components/wizards/YJogWizard.tsx';
import { ZJogWizard } from 'app/features/Config/components/wizards/ZJogWizard.tsx';
import { GRBL, GRBLHAL, LIGHTWEIGHT_OPTIONS } from 'app/constants';
import { LaserWizard } from 'app/features/Config/components/wizards/LaserWizard.tsx';
import {
    GamepadLinkWizard,
    KeyboardLinkWizard,
} from 'app/features/Config/components/ShortcutLinkWizards.tsx';
import controller from 'app/lib/controller.ts';
import get from 'lodash/get';
import store from 'app/store';
import { TOOLCHANGE_OPTIONS } from 'app/features/Preferences/ToolChange/ToolChange';

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
    | 'api'
    | 'location'
    | 'wizard';

export type gSenderSettingsValues = number | string | boolean;

export interface gSenderSetting {
    label?: string;
    type: gSenderSettingType;
    key?: string;
    description?: string | any[];
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
    disabled?: () => boolean;
    hidden?: () => boolean;
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
                        disabled: () => {
                            return controller.portOpen;
                        },
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
                        key: 'workspace.shouldWarnZero',
                        description:
                            'Useful if you tend to set zero accidentally',
                        type: 'boolean',
                    },
                    {
                        label: 'Warn if beyond soft limits',
                        key: 'widgets.visualizer.showSoftLimitWarning',
                        description:
                            'Be told if your file exceeds your machine limits based on the current zero point (homing and soft limits must be enabled)',
                        type: 'boolean',
                        disabled: () => {
                            const connected = controller.portOpen;
                            if (!connected) {
                                return true; // disabled when not connected.
                            }
                            const c_settings = get(
                                controller,
                                'settings.settings',
                                {},
                            );
                            const $20 = Number(get(c_settings, '$20', 0));
                            return $20 === 0;
                        },
                    },
                    {
                        label: 'Enable popup for Job End & Maintenance Alerts',
                        key: 'widgets.visualizer.jobEndModal',
                        description:
                            'Show a pop up with job details after a job finishes, and another popup to alert you of maintenance tasks that are due.',
                        type: 'boolean',
                    },
                    {
                        label: 'Safe Height',
                        key: 'workspace.safeRetractHeight',
                        type: 'number',
                        unit: 'mm',
                        description:
                            "Amount Z-axis will move up from its current position before making an X/Y/A movement (only for gotos and quick-movements in gSender, doesn't apply to files, if homing is enabled this value becomes the offset from the top of the Z-axis, default 0)",
                    },
                    {
                        label: 'Park Location',
                        key: 'workspace.park',
                        type: 'location',
                        description:
                            'Set a Park location, which lets you move the router to a pre-determined place when homing is enabled.  Use Grab Location to use the current router position.',
                    },
                    {
                        label: 'Default Firmware',
                        type: 'select',
                        key: 'workspace.defaultFirmware',
                        description:
                            'If automatic detection of firmware fails on connection, this lets you decide which firmware flavour should gSender use as a default.',
                        options: [GRBL, GRBLHAL],
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
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: 'XY Thickness',
                        key: 'workspace.probeProfile.xyThickness',
                        description:
                            'Measure the plate thickness where the cutting tool will touch off when probing the X and Y axes (default 10)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType !== TOUCHPLATE_TYPE_STANDARD;
                        },
                    },
                    {
                        label: 'Z Probe Distance',
                        key: 'widgets.probe.zProbeDistance',
                        description:
                            'How far to travel in Z until it gives up on probing, if you get an alarm 2 for soft limits when probing then reduce this value (default 30)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: 'Fast Find',
                        key: 'widgets.probe.probeFastFeedrate',
                        description:
                            'Probe speed before the first touch-off (default 150)',
                        type: 'number',
                        unit: 'mm/min',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: 'Slow Find',
                        key: 'widgets.probe.probeFeedrate',
                        description:
                            'Slower speed for more accuracy on second touch-off (default 75)',
                        type: 'number',
                        unit: 'mm/min',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: 'Retraction',
                        key: 'widgets.probe.retractionDistance',
                        description:
                            'How far the probe moves away after a successful touch (default 4)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using auto touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
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
                label: '',
                settings: [
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
                        eID: '$170',
                    },
                    {
                        type: 'eeprom',
                        eID: '$171',
                    },
                    {
                        type: 'eeprom',
                        eID: '$172',
                    },
                    {
                        type: 'eeprom',
                        eID: '$173',
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
                    {
                        type: 'eeprom',
                        eID: '$347',
                    },
                    {
                        type: 'eeprom',
                        eID: '$348',
                    },
                    {
                        type: 'eeprom',
                        eID: '$349',
                    },
                    {
                        type: 'eeprom',
                        eID: '$350',
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
                wizard: LaserWizard,
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
                        label: 'Laser on during outline',
                        key: 'widgets.spindle.laser.laserOnOutline',
                        type: 'boolean',
                        description:
                            'See the job position better by turning on the laser at its lowest power while outlining.',
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
                            'Strategy that gSender will use to handle tool change commands\n\nStandard will initiate a guided process through which the user will manually probe a new tool to compensate for length differences.\n\nFlexible is similar, using a saved tool offset.\n\nFixed is an almost fully automated process in which a preconfigured bitsetter or probe block is used to set new tool length.  Limit switches required.\n\nCode runs blocks before and after the toolchange',
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
                        type: 'location',
                        label: 'Fixed Sensor Location',
                        key: 'workspace.toolChangePosition',
                        description:
                            'Set fixed tool sensor position at current machine position - this will be the start location for probing.  Your Z value should be negative.',
                        hidden: () => {
                            const strategy = store.get(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Fixed Tool Sensor';
                        },
                    },
                    {
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.preHook',
                        label: 'Before Tool Change',
                        description:
                            'When using the Code strategy, this code is run as soon as an M6 command is encountered.',
                        hidden: () => {
                            const strategy = store.get(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Code';
                        },
                    },
                    {
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.postHook',
                        label: 'After Tool Change',
                        description:
                            'When using the Code strategy, this code is run after a tool change is completed.',
                        hidden: () => {
                            const strategy = store.get(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Code';
                        },
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
                    {
                        label: 'Enable Dark Mode',
                        key: 'workspace.enableDarkMode',
                        description: 'Enable dark mode for the UI',
                        type: 'boolean',
                    },
                ],
            },
            {
                label: 'Rapid Jogging',
                settings: [
                    {
                        label: 'XY',
                        key: 'widgets.axes.jog.rapid.xyStep',
                        type: 'number',
                        description: 'Rapid jogging amount in the XY axes.',
                        unit: 'mm',
                    },
                    {
                        label: 'Z',
                        key: 'widgets.axes.jog.rapid.zStep',
                        description: 'Rapid jogging amount in the Z axis.',
                        type: 'number',
                        unit: 'mm',
                    },
                    {
                        label: 'A',
                        key: 'widgets.axes.jog.rapid.aStep',
                        description: 'Rapid jogging amount in the A axis.',
                        type: 'number',
                        unit: 'deg',
                    },
                    {
                        label: 'Feedrate',
                        key: 'widgets.axes.jog.rapid.feedrate',
                        description:
                            'Feedrate to use when jogging in this preset.',
                        type: 'number',
                        unit: 'mm/min',
                    },
                ],
            },
            {
                label: 'Normal Jogging',
                settings: [
                    {
                        label: 'XY',
                        key: 'widgets.axes.jog.normal.xyStep',
                        type: 'number',
                        description: 'Normal jogging amount in the XY axes.',
                        unit: 'mm',
                    },
                    {
                        label: 'Z',
                        key: 'widgets.axes.jog.normal.zStep',
                        description: 'Normal jogging amount in the Z axis.',
                        type: 'number',
                        unit: 'mm',
                    },
                    {
                        label: 'A',
                        key: 'widgets.axes.jog.normal.aStep',
                        description: 'Normal jogging amount in the A axis.',
                        type: 'number',
                        unit: 'deg',
                    },
                    {
                        label: 'Feedrate',
                        key: 'widgets.axes.jog.normal.feedrate',
                        description:
                            'Feedrate to use when jogging in this preset.',
                        type: 'number',
                        unit: 'mm/min',
                    },
                ],
            },
            {
                label: 'Precise Jogging',
                settings: [
                    {
                        label: 'XY',
                        key: 'widgets.axes.jog.precise.xyStep',
                        type: 'number',
                        description: 'Precise jogging amount in the XY axes.',
                        unit: 'mm',
                    },
                    {
                        label: 'Z',
                        key: 'widgets.axes.jog.precise.zStep',
                        description: 'Precise jogging amount in the Z axis.',
                        type: 'number',
                        unit: 'mm',
                    },
                    {
                        label: 'A',
                        key: 'widgets.axes.jog.precise.aStep',
                        description: 'Precise jogging amount in the A axis.',
                        type: 'number',
                        unit: 'deg',
                    },
                    {
                        label: 'Feedrate',
                        key: 'widgets.axes.jog.precise.feedrate',
                        description:
                            'Feedrate to use when jogging in this preset.',
                        type: 'number',
                        unit: 'mm/min',
                    },
                ],
            },
            {
                label: 'Shortcuts',
                settings: [
                    {
                        label: 'Keyboard',
                        type: 'wizard',
                        wizard: KeyboardLinkWizard,
                        description:
                            'Set up movements and macros with keys or key combinations on your keyboard (manipulate most of gSender, with many shortcuts already set, and also support for Numpads, macro pads, and wireless keyboards)',
                    },
                    {
                        label: 'Gamepad',
                        type: 'wizard',
                        wizard: GamepadLinkWizard,
                        description:
                            'Easily jog, set zeros, start jobs, and more using many common gamepads (set up your own profile or use a pre-tested gamepad profile)',
                    },
                ],
            },
            {
                label: 'Visualizer',
                settings: [
                    {
                        label: 'Theme',
                        key: 'widgets.visualizer.theme',
                        description: '',
                        type: 'select',
                        options: ['Light', 'Dark'],
                    },
                    {
                        label: 'Lightweight options',
                        key: 'widgets.visualizer.liteOption',
                        description:
                            'The Light option shows an SVG visualizer, while Everything disables the visualizer entirely.',
                        type: 'select',
                        options: [
                            LIGHTWEIGHT_OPTIONS.LIGHT,
                            LIGHTWEIGHT_OPTIONS.EVERYTHING,
                        ],
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
                    { type: 'eeprom', eID: '$160' },
                    { type: 'eeprom', eID: '$161' },
                    { type: 'eeprom', eID: '$162' },
                    { type: 'eeprom', eID: '$163' },
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
                    { type: 'eeprom', eID: '$744' },
                    { type: 'eeprom', eID: '$745' },
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
