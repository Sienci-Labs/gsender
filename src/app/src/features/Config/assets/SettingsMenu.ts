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
    TOUCHPLATE_TYPE_3D_TOUCH,
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
import { GRBL, GRBLHAL, LIGHTWEIGHT_OPTIONS, OUTLINE_MODES } from 'app/constants';
import { LaserWizard } from 'app/features/Config/components/wizards/LaserWizard.tsx';
import {
    GamepadLinkWizard,
    KeyboardLinkWizard,
} from 'app/features/Config/components/ShortcutLinkWizards.tsx';
import controller from 'app/lib/controller.ts';
import get from 'lodash/get';
import store from 'app/store';
import pubsub from 'pubsub-js';
import { EEPROM } from 'app/definitions/firmware';

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
    | 'jog'
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
    eID?: EEPROM;
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
    onDisable?: () => void;
    onUpdate?: () => void;
    min?: number;
    max?: number;
}

export interface gSenderSubSection {
    label?: string;
    wizard?: () => JSX.Element;
    settings?: gSenderSetting[];
}

export type gSenderSettings = gSenderSetting | gSenderSubSection;
export type gSenderEEEPROMSettings = gSenderEEPROMSettingSection[];

export interface gSenderEEPROMSetting {
    eId: EEPROM;
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
                        label: 'Carve screen units',
                        key: 'workspace.units',
                        type: 'radio',
                        description:
                            'What units would you prefer to see on the carve screen? Config will always be metric since all common CNC firmware requires metric values as input.',
                        options: ['mm', 'in'],
                    },
                    {
                        label: 'Reconnect automatically',
                        key: 'widgets.connection.autoReconnect',
                        type: 'boolean',
                        description:
                            'Reconnect to the last machine you used automatically when you open gSender.',
                    },
                    {
                        label: 'Firmware fallback',
                        type: 'select',
                        key: 'workspace.defaultFirmware',
                        description:
                            'The firmware gSender will resort to using if automatic detection fails.',
                        options: [GRBL, GRBLHAL],
                    },
                    {
                        label: 'Baud rate',
                        key: 'widgets.connection.baudrate',
                        type: 'select',
                        description:
                            'Needs to match up with the value your CNC uses. (Serial transmission speed, Default 115200)',
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
                        label: 'Safe height',
                        key: 'workspace.safeRetractHeight',
                        type: 'number',
                        unit: 'variable',
                        description:
                            "Amount Z-axis will move up before moving in X/Y/A using go tos. (Doesn't apply to files, corner-movements, or parking, if homing is enabled this value becomes an offset from the top of the Z-axis, Default 0)",
                    },
                    {
                        label: 'Outline style',
                        key: 'workspace.outlineMode',
                        type: 'select',
                        description: 'Detailed follows the outline of the loaded file more closely, while Square calculates much faster since it runs a simple box outline.',
                        options: OUTLINE_MODES
                    },
                    {
                        label: 'Send usage data',
                        key: 'workspace.sendUsageData',
                        description:
                            'This info is sent to us as an anonymous data point, but greatly helps us improve gSender by seeing how people use it.',
                        type: 'boolean',
                    },
                ],
            },
            {
                label: 'UI Options',
                settings: [
                    {
                        label: 'Dark mode',
                        key: 'workspace.enableDarkMode',
                        description:
                            'Change the app colours for reduced eye strain, better contrast, or just for fun!',
                        type: 'boolean',
                    },
                    {
                        label: 'Visualizer theme',
                        key: 'widgets.visualizer.theme',
                        description:
                            'Independant colour control for the visualizer.',
                        type: 'select',
                        options: ['Light', 'Dark'],
                        onUpdate: () => {
                            pubsub.publish('theme:change');
                        },
                    },
                    {
                        label: 'Lightweight options',
                        key: 'widgets.visualizer.liteOption',
                        description:
                            'Enable with the feather when big files are slowing down your computer. (Light turns off 3D file view, Everything disables the visualizer)',
                        type: 'select',
                        options: [
                            LIGHTWEIGHT_OPTIONS.LIGHT,
                            LIGHTWEIGHT_OPTIONS.EVERYTHING,
                        ],
                    },
                    {
                        label: 'DRO zeros',
                        key: 'workspace.customDecimalPlaces',
                        description:
                            'Set the number of decimal places shown between 1-4. (Default 0 shows 2 for mm and 3 for inches)',
                        type: 'number',
                        min: 0,
                        max: 4,
                    },
                ],
            },
            {
                label: 'Jogging Presets',
                settings: [
                    {
                        label: 'Rapid',
                        type: 'jog',
                        description: '',
                        key: 'widgets.axes.jog.rapid',
                    },
                    {
                        label: 'Normal',
                        type: 'jog',
                        description:
                            'Set the movement distances and speeds used for each jogging preset.',
                        key: 'widgets.axes.jog.normal',
                    },
                    {
                        label: 'Precise',
                        type: 'jog',
                        description: '',
                        key: 'widgets.axes.jog.precise',
                    },
                    {
                        label: 'Continuous jog delay',
                        type: 'number',
                        unit: 'ms',
                        description:
                            'Where regular presses or clicks make single movements, hold for this long to begin jogging continuously. Some might prefer a longer delay like 700. (Default 250)',
                        key: 'widgets.axes.jog.threshold',
                        min: 50
                    }
                ],
            },
            {
                label: 'Notifications',
                settings: [
                    {
                        label: 'Warn if bad file',
                        key: 'widgets.visualizer.showWarning',
                        description:
                            'Warns if any invalid commands are found when a file is opened.',
                        type: 'boolean',
                    },
                    {
                        label: 'Warn on bad line',
                        key: 'widgets.visualizer.showLineWarnings',
                        description:
                            'Warns if any invalid commands are found when running a job.',
                        type: 'boolean',
                    },
                    {
                        label: 'Warn when setting zero',
                        key: 'workspace.shouldWarnZero',
                        description:
                            'Useful if you tend to set zero accidentally.',
                        type: 'boolean',
                    },
                    {
                        label: 'Warn if beyond soft limits',
                        key: 'widgets.visualizer.showSoftLimitWarning',
                        description:
                            'Warns if your file exceeds your machine limits based on the current zero point. (Homing and soft limits must be enabled)',
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
                        label: 'Job end notifications',
                        key: 'widgets.visualizer.jobEndModal',
                        description:
                            'Show a carving summary at the end of each job.',
                        type: 'boolean',
                    },
                    {
                        label: 'Maintenance notifications',
                        key: 'widgets.visualizer.maintenanceTaskNotifications',
                        description:
                            'Show upcoming maintenance tasks at the end of each job.',
                        type: 'boolean',
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
                            'Control your CNC and navigate through gSender using custom key combinations on any keyboard, numpad, or macro pad.',
                    },
                    {
                        label: 'Gamepad',
                        type: 'wizard',
                        wizard: GamepadLinkWizard,
                        description:
                            'Easily jog, set zeros, start jobs, and more using most common gamepads. Create your own profile or use a pre-made one.',
                    },
                ],
            },
        ],
    },
    {
        label: 'Customize UI',
        icon: MdSettingsApplications,
        settings: [],
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
                            'Misaligned rails can cause 90 degree cuts to come out skewed, the wizard will help fix this.',
                        hidden: () => {
                            const connected = controller.portOpen
                            return !connected;
                        }
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
                        toolLinkLabel: '/tools/movement-tuning',
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
                        toolLinkLabel: '/tools/movement-tuning',
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
                        toolLinkLabel: '/tools/movement-tuning',
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
                        label: 'Touch plate type',
                        key: 'workspace.probeProfile.touchplateType',
                        type: 'select',
                        description:
                            "Select the touch plate you're using with your machine. (Default Standard block)",
                        options: [
                            TOUCHPLATE_TYPE_STANDARD,
                            TOUCHPLATE_TYPE_AUTOZERO,
                            TOUCHPLATE_TYPE_ZERO,
                            TOUCHPLATE_TYPE_3D_TOUCH,
                        ],
                    },
                    {
                        label: 'Z thickness',
                        key: 'workspace.probeProfile.zThickness',
                        description:
                            'Plate thickness where the bit touches when Z-axis probing. (Default 15)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or 3D Touch Probe touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO || probeType === TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'XY thickness',
                        key: 'workspace.probeProfile.xyThickness',
                        description:
                            'Plate thickness where the bit touches when X/Y-axis probing. (Default 10)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or Z-only touchplate
                            return probeType !== TOUCHPLATE_TYPE_STANDARD;
                        },
                    },
                    {
                        label: 'Ball Point Diameter',
                        key: 'workspace.probeProfile.ballDiameter',
                        description:
                            'Ball point diameter for 3D Touch Probe. (Default 2mm)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Only show for 3D Touch Probe
                            return probeType !== TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'XY plunge distance',
                        key: 'workspace.probeProfile.xyPlungeDistance',
                        description:
                            'Maximum distance to plunge in X/Y directions for 3D Touch Probe. (Default 10mm)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Only show for 3D Touch Probe
                            return probeType !== TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'Z probe distance',
                        key: 'widgets.probe.zProbeDistance',
                        description:
                            'Movement in Z before it gives up on probing. (Reduce this value if you get a soft limit alarm 2 when probing, Default 30)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: 'Fast find',
                        key: 'widgets.probe.probeFastFeedrate',
                        description:
                            'Probe speed before the first touch-off. (Default 150)',
                        type: 'number',
                        unit: 'mm/min',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or 3D Touch Probe touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO || probeType === TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'Slow find',
                        key: 'widgets.probe.probeFeedrate',
                        description:
                            'Speed for the more accurate second touch-off. (Default 75)',
                        type: 'number',
                        unit: 'mm/min',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or 3D Touch Probe touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO || probeType === TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'Retraction',
                        key: 'widgets.probe.retractionDistance',
                        description:
                            'How far the bit moves away after a successful touch. (Default 4)',
                        type: 'number',
                        unit: 'mm',
                        hidden: () => {
                            const probeType = store.get(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or 3D Touch Probe touchplate
                            return probeType === TOUCHPLATE_TYPE_AUTOZERO || probeType === TOUCHPLATE_TYPE_3D_TOUCH;
                        },
                    },
                    {
                        label: 'Connection test',
                        key: 'widgets.probe.connectivityTest',
                        description:
                            'Safety check to make sure your probe is connected correctly.',
                        type: 'boolean',
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
        label: 'Homing/Limits',
        icon: FaHome,
        wizard: LimitSwitchIndicators,
        settings: [
            {
                label: '',
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
                label: 'Homing Behaviour',
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
                        type: 'eeprom',
                        eID: '$46',
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
                        eID: '$193',
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
                ],
            },
            {
                label: 'Parking',
                settings: [
                    {
                        label: 'Park location',
                        key: 'workspace.park',
                        type: 'location',
                        unit: 'mm',
                        description:
                            'The P on the main Carve page will always take you to this convenient parking spot. (Homing must be enabled)',
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
                        label: 'Spindle/laser controls',
                        description:
                            'Show the Spindle/Laser tab and related functions on the main Carve page.',
                        key: 'workspace.spindleFunctions',
                        onDisable: () => {
                            // Disable laser mode if spindle functions turned off. TBD what to do with EEPROM.
                            store.set('widgets.spindle.mode', 'spindle');
                        },
                    },
                    {
                        type: 'eeprom',
                        eID: '$32',
                    },
                    {
                        label: 'Spindle on delay',
                        key: 'widgets.spindle.delay',
                        description:
                            'Adds a delay to give the spindle time to spin up. ($392)',
                        type: 'hybrid',
                        eID: '$392',
                        unit: 's',
                    },
                    {
                        label: 'Minimum spindle speed',
                        key: 'widgets.spindle.spindleMin',
                        description:
                            'Match this to the minimum speed of your spindle. ($31)',
                        type: 'hybrid',
                        eID: '$31',
                        unit: 'rpm',
                    },
                    {
                        label: 'Maximum spindle speed',
                        key: 'widgets.spindle.spindleMax',
                        description:
                            'Match this to the maximum speed of your spindle. ($30)',
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
                        label: 'Minimum laser power',
                        key: 'widgets.spindle.laser.minPower',
                        description:
                            'Match this to the minimum S word setting in your laser CAM software. ($731)',
                        type: 'hybrid',
                        eID: '$731',
                        unit: '',
                    },
                    {
                        label: 'Maximum laser power',
                        key: 'widgets.spindle.laser.maxPower',
                        description:
                            'Match this to the maximum S word setting in your laser CAM software. ($730)',
                        type: 'hybrid',
                        eID: '$730',
                        unit: '',
                    },
                    {
                        label: 'Laser on during outline',
                        key: 'widgets.spindle.laser.laserOnOutline',
                        type: 'boolean',
                        description:
                            "Turn on the laser at it's lowest power to see the job position better.",
                    },
                    {
                        label: 'Laser X offset',
                        key: 'widgets.spindle.laser.xOffset',
                        description:
                            'X-axis offset from the spindle. (Mark with a v-bit then track the laser movement to reach that mark, $741)',
                        type: 'hybrid',
                        eID: '$741',
                        unit: 'mm',
                    },
                    {
                        label: 'Laser Y offset',
                        key: 'widgets.spindle.laser.yOffset',
                        description:
                            'Y-axis offset from the spindle. (Mark with a v-bit then track the laser movement to reach that mark, $742)',
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
        label: 'Accessory Outputs',
        icon: CiMapPin,
        wizard: AccessoryOutputWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'Coolant controls',
                        key: 'workspace.coolantFunctions',
                        description:
                            'Show the coolant tab and related functions on the main Carve page.',
                        type: 'boolean',
                    },
                    { type: 'eeprom', eID: '$456' },
                    { type: 'eeprom', eID: '$457' },
                    { type: 'eeprom', eID: '$458' },
                    { type: 'eeprom', eID: '$459' },
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
                        label: 'Rotary controls',
                        key: 'widgets.rotary.tab.show',
                        description:
                            'Show the Rotary tab and related functions on the main Carve page.',
                        type: 'boolean',
                    },
                    { type: 'eeprom', eID: '$376' },
                    {
                        label: 'Resolution',
                        key: 'workspace.rotaryAxis.firmwareSettings.$101',
                        description:
                            'Travel resolution in steps per degree. ($103)',
                        type: 'hybrid',
                        eID: '$103',
                        unit: 'step/deg',
                    },
                    {
                        label: 'Max speed',
                        key: 'workspace.rotaryAxis.firmwareSettings.$111',
                        description:
                            'Max axis speed, also used for G0 rapids. ($113)',
                        type: 'hybrid',
                        eID: '$113',
                        unit: 'deg/min',
                    },
                    { type: 'eeprom', eID: '$123' },
                    {
                        label: 'Force hard limits',
                        key: 'workspace.rotaryAxis.firmwareSettings.$21',
                        description:
                            'Updates hard limits to this value when toggling into rotary mode.',
                        type: 'number',
                    },
                    {
                        label: 'Force soft limits',
                        key: 'workspace.rotaryAxis.firmwareSettings.$20',
                        description:
                            'Updates soft limits to this value when toggling into rotary mode.',
                        type: 'number',
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
                            'Runs when you start a job, before the file itself runs.',
                    },
                    {
                        label: 'File pause',
                        type: 'event',
                        eventType: 'gcode:pause',
                        description:
                            "If you'd like to stop accessories or move out of the way when you pause during a job.",
                    },
                    {
                        label: 'File resume',
                        type: 'event',
                        eventType: 'gcode:resume',
                        description:
                            'Ensure that anything you set up for File pause is undone when you resume.',
                    },
                    {
                        label: 'File stop/end',
                        type: 'event',
                        eventType: 'gcode:stop',
                        description:
                            'A catch-all to ensure that stopped or ended jobs always safely turn everything off.',
                    },
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
                            'Send tool change lines as-is, assuming your CNC can properly handle M6 and T commands.',
                    },
                    {
                        label: 'gSender strategy',
                        type: 'select',
                        description:
                            'Standard wizard will guide you through the steps to manually set up a new tool and resume cutting.\n\nFlexible is similar but uses a touch plate like a tool length sensor.\n\nFixed is also guided but fully automated, moving around and measuring tools for you. Homing and TLS required.\n\nCode is for fully custom setups.',
                        options: [
                            'Ignore',
                            'Pause',
                            'Standard Re-zero',
                            'Flexible Re-zero',
                            'Fixed Tool Sensor',
                            'Code',
                        ],
                        key: 'workspace.toolChangeOption',
                    },
                    {
                        label: 'Skip dialog',
                        type: 'boolean',
                        key: 'workspace.toolChange.skipDialog',
                        description:
                            "Won't prompt on Pause, and won't pause between Code blocks.",
                    },
                    {
                        label: 'Fixed sensor location',
                        type: 'location',
                        key: 'workspace.toolChangePosition',
                        unit: 'mm',
                        description:
                            'The start location for probing. To not break bits, set it using a long tool with extra Z-axis space above the sensor. (Z should be negative)',
                        hidden: () => {
                            const strategy = store.get(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Fixed Tool Sensor';
                        },
                    },
                    {
                        label: 'Before tool change',
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.preHook',
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
                        label: 'After tool change',
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.postHook',
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
        label: 'Ethernet',
        icon: BsEthernet,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: 'IP address',
                        key: 'widgets.connection.ip',
                        description:
                            'Set the IP address for network scanning. (Default 192.168.5.1)',
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
