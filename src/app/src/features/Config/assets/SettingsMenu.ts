/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import api from 'app/api';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { getAvailableLanguages, i18n, LANGUAGE_SYSTEM, tk } from 'app/i18n';
import {
    GRBL,
    GRBLHAL,
    IMPERIAL_UNITS,
    LASER_MODE,
    LIGHTWEIGHT_OPTIONS,
    OUTLINE_MODES,
    SPINDLE_MODE,
    THEMES,
    WORKSPACE_MODE,
} from 'app/constants';
import type { EEPROM, FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import type {
    BasicPosition,
    UNITS_EN,
    UNITS_GCODE,
} from 'app/definitions/general';
import {
    GamepadLinkWizard,
    KeyboardLinkWizard,
} from 'app/features/Config/components/ShortcutLinkWizards.tsx';
import { AccessoryOutputWizard } from 'app/features/Config/components/wizards/AccessoryOutputWizard.tsx';
import { AJogWizard } from 'app/features/Config/components/wizards/AJogWizard.tsx';
import { LaserWizard } from 'app/features/Config/components/wizards/LaserWizard.tsx';
import { LimitSwitchIndicators } from 'app/features/Config/components/wizards/LimitSwitchIndicators.tsx';
import { ProbePinStatus } from 'app/features/Config/components/wizards/ProbePinStatus.tsx';
import { SpindleWizard } from 'app/features/Config/components/wizards/SpindleWizard.tsx';
import { SquaringToolWizard } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';
import { XJogWizard } from 'app/features/Config/components/wizards/XJogWizard.tsx';
import { YJogWizard } from 'app/features/Config/components/wizards/YJogWizard.tsx';
import { ZJogWizard } from 'app/features/Config/components/wizards/ZJogWizard.tsx';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import type {
    LaserState,
    SPINDLE_LASER_T,
    Spindle,
} from 'app/features/Spindle/definitions';
import type { THEMES_T } from 'app/features/Visualizer/definitions';
import {
    TOUCHPLATE_TYPE_3D,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_BITZERO,
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_ZERO,
} from 'app/lib/constants';
import controller from 'app/lib/controller.ts';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { round, roundMetric } from 'app/lib/rounding';
import { toast } from 'app/lib/toaster';
import { TOASTER_DISABLED, TOASTER_LONG } from 'app/lib/toaster/ToasterLib';
import { convertToImperial } from 'app/lib/units';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import { updatePartialControllerSettings } from 'app/store/redux/slices/controller.slice';
import isElectron from 'is-electron';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import posthog from 'posthog-js';
import pubsub from 'pubsub-js';
import type { JSX } from 'react';
import type { IconType } from 'react-icons';
import { BsEthernet } from 'react-icons/bs';
import { CiLight, CiMapPin } from 'react-icons/ci';
import { FaCog, FaHome, FaRobot } from 'react-icons/fa';
import { FaArrowsSpin } from 'react-icons/fa6';
import { GiTargetLaser } from 'react-icons/gi';
import { IoIosSwap } from 'react-icons/io';
import {
    MdAccessibility,
    MdOutlineReadMore,
    MdSettingsApplications,
    MdTouchApp,
} from 'react-icons/md';
import { PiEngine } from 'react-icons/pi';
import { RxButton } from 'react-icons/rx';
import { SiCoronaengine } from 'react-icons/si';

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
    | 'wizard'
    | 'path';

export type gSenderSettingsValues = number | string | boolean;

export interface gSenderSetting {
    label?: string;
    type: gSenderSettingType;
    key?: string;
    description?: string;
    options?: string[] | number[];
    /** Display text for each option (tk() keys); options stay the stored values. */
    labels?: string[];
    unit?: string;
    eID?: EEPROM;
    globalIndex?: number;
    value?: gSenderSettingsValues;
    defaultValue?: any;
    dirty?: boolean;
    ignoreDefaultCheck?: boolean;
    eventType?: string;
    wizard?: () => JSX.Element;
    toolLink?: string;
    toolLinkLabel?: string;
    disabled?: () => boolean;
    hidden?: (getPending: (key: string, defaultValue?: any) => any) => boolean;
    valueTransform?: (v: any) => any;
    onDisable?: () => void;
    onEnable?: () => void;
    onUpdate?: () => void;
    onApply?: () => void;
    onChange?: (args?: any) => void;
    min?: number;
    max?: number;
    remap?: EEPROM;
    remapped?: boolean;
    forceEEPROM?: boolean;
    hideWhenFirmwareCurrent?: boolean;
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
        label: tk('config:basics.title'),
        icon: FaCog,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: tk('common:language.label'),
                        key: 'workspace.language',
                        type: 'select',
                        description: tk('common:language.description'),
                        options: [
                            LANGUAGE_SYSTEM,
                            ...getAvailableLanguages().map((l) => l.code),
                        ],
                        // Native names are shown as-is in every language.
                        labels: [
                            tk('common:language.systemDefault'),
                            ...getAvailableLanguages().map((l) => l.nativeName),
                        ],
                        defaultValue: LANGUAGE_SYSTEM,
                    },
                    {
                        label: tk('config:basics.carveScreenUnits.label'),
                        key: 'workspace.units',
                        type: 'radio',
                        description: tk(
                            'config:basics.carveScreenUnits.description',
                        ),
                        options: ['mm', 'in'],
                    },
                    {
                        label: tk('config:basics.reconnectAutomatically.label'),
                        key: 'widgets.connection.autoReconnect',
                        type: 'boolean',
                        description: tk(
                            'config:basics.reconnectAutomatically.description',
                        ),
                    },
                    {
                        label: tk('config:basics.firmwareFallback.label'),
                        type: 'select',
                        key: 'workspace.defaultFirmware',
                        description: tk(
                            'config:basics.firmwareFallback.description',
                        ),
                        options: [GRBL, GRBLHAL],
                    },
                    {
                        label: tk('config:basics.baudRate.label'),
                        key: 'widgets.connection.baudrate',
                        type: 'select',
                        description: tk('config:basics.baudRate.description'),
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
                        label: tk('config:basics.safeHeight.label'),
                        key: 'workspace.safeRetractHeight',
                        type: 'number',
                        unit: 'variable',
                        description: tk('config:basics.safeHeight.description'),
                    },
                    {
                        label: tk('config:basics.checkFileOnLoad.label'),
                        key: 'widgets.visualizer.checkFile',
                        description: tk(
                            'config:basics.checkFileOnLoad.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.outlineStyle.label'),
                        key: 'workspace.outlineMode',
                        type: 'select',
                        description: tk(
                            'config:basics.outlineStyle.description',
                        ),
                        options: OUTLINE_MODES,
                        labels: [
                            tk('config:options.outline.detailed'),
                            tk('config:options.outline.square'),
                            tk('config:options.outline.rapidlessSquare'),
                        ],
                    },
                    {
                        label: tk('config:basics.outlineSpeed.label'),
                        key: 'workspace.outlineSpeed',
                        type: 'number',
                        unit: 'mm/min',
                        description: tk(
                            'config:basics.outlineSpeed.description',
                        ),
                    },
                    {
                        label: tk('config:basics.revertWorkspace.label'),
                        key: 'workspace.revertWorkspace',
                        type: 'boolean',
                        defaultValue: false,
                        description: tk(
                            'config:basics.revertWorkspace.description',
                        ),
                        options: OUTLINE_MODES,
                    },
                    {
                        label: tk('config:basics.powerSaving.label'),
                        key: 'workspace.powerSaving',
                        type: 'boolean',
                        description: tk(
                            'config:basics.powerSaving.description',
                        ),
                        onEnable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'change-power-saving',
                                    true,
                                );
                            }
                        },
                        onDisable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'change-power-saving',
                                    false,
                                );
                            }
                        },
                    },
                    {
                        label: tk('config:basics.promptOnExit.label'),
                        key: 'workspace.promptExit',
                        type: 'boolean',
                        description: tk(
                            'config:basics.promptOnExit.description',
                        ),
                        onEnable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'assignPromptExit',
                                    true,
                                );
                            }
                        },
                        onDisable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'assignPromptExit',
                                    false,
                                );
                            }
                        },
                    },
                    {
                        label: tk('config:basics.allowGcamToSendFiles.label'),
                        key: 'workspace.allowGcamHandoff',
                        type: 'boolean',
                        defaultValue: true,
                        description: tk(
                            'config:basics.allowGcamToSendFiles.description',
                        ),
                        hidden: () => !isElectron(),
                        onEnable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'gcam-handoff:set-enabled',
                                    true,
                                );
                            }
                        },
                        onDisable: () => {
                            if (isElectron()) {
                                (window as any).ipcRenderer.send(
                                    'gcam-handoff:set-enabled',
                                    false,
                                );
                            }
                        },
                    },
                    {
                        label: tk('config:basics.runSettingsBackup.label'),
                        key: 'workspace.backupFreq',
                        type: 'select',
                        description: tk(
                            'config:basics.runSettingsBackup.description',
                        ),
                        options: ['On Update', 'Daily', 'Weekly', 'Monthly'],
                        labels: [
                            tk('config:options.backupFrequency.onUpdate'),
                            tk('config:options.backupFrequency.daily'),
                            tk('config:options.backupFrequency.weekly'),
                            tk('config:options.backupFrequency.monthly'),
                        ],
                        hidden: () => {
                            return !isElectron();
                        },
                    },
                    {
                        label: tk('config:basics.settingsBackupLocation.label'),
                        key: 'workspace.backupLoc',
                        type: 'path',
                        description: tk(
                            'config:basics.settingsBackupLocation.description',
                        ),
                        hidden: () => {
                            return !isElectron();
                        },
                    },
                    {
                        label: tk(
                            'config:basics.importedPluginsLocation.label',
                        ),
                        key: 'workspace.userPluginsDir',
                        type: 'path',
                        description: tk(
                            'config:basics.importedPluginsLocation.description',
                        ),
                        onApply: () => {
                            const value = store.get(
                                'workspace.userPluginsDir',
                                '',
                            );
                            api.plugins
                                .updateSettings(value)
                                .then((res) => {
                                    store.set(
                                        'workspace.userPluginsDir',
                                        res.data.userPluginsDir,
                                    );
                                    const { previousUserPluginsDir } = res.data;
                                    const abandonedPreviousDir =
                                        previousUserPluginsDir &&
                                        previousUserPluginsDir !==
                                            res.data.userPluginsDir;
                                    const message = abandonedPreviousDir
                                        ? i18n.t(
                                              'config:basics.importedPluginsLocation.restartAbandoned',
                                              { previousUserPluginsDir },
                                          )
                                        : i18n.t(
                                              'config:basics.importedPluginsLocation.restart',
                                          );
                                    toast.info(message, {
                                        duration: TOASTER_LONG,
                                    });
                                })
                                .catch(() => {
                                    toast.error(
                                        i18n.t(
                                            'config:basics.importedPluginsLocation.updateFailed',
                                        ),
                                    );
                                });
                        },
                        hidden: () => {
                            return !isElectron();
                        },
                    },
                    {
                        label: tk('config:basics.collectUsageData.label'),
                        key: 'workspace.collectUsageDataStatus',
                        description: tk(
                            'config:basics.collectUsageData.description',
                        ),
                        type: 'boolean',
                        valueTransform: (v: any) =>
                            v === 'accepted' || v === true,
                        onApply: () => {
                            const toggle = store.get(
                                'workspace.collectUsageDataStatus',
                            );
                            store.replace(
                                'workspace.collectUsageDataStatus',
                                toggle === true || toggle === 'accepted'
                                    ? 'accepted'
                                    : 'denied',
                            );

                            if (toggle === true || toggle === 'accepted') {
                                posthog.opt_in_capturing();
                                posthog?.capture('data_collection_accepted');
                            } else {
                                posthog.opt_out_capturing();
                                posthog?.capture('data_collection_declined');
                            }
                        },
                        ignoreDefaultCheck: true,
                    },
                ],
            },
            {
                label: tk('config:basics.uiOptionsGroup'),
                settings: [
                    {
                        label: tk('config:basics.darkMode.label'),
                        key: 'workspace.enableDarkMode',
                        description: tk('config:basics.darkMode.description'),
                        type: 'boolean',
                    },
                    {
                        label: tk(
                            'config:basics.usePendantViewAsDefault.label',
                        ),
                        key: 'workspace.usePendantViewAsDefault',
                        description: tk(
                            'config:basics.usePendantViewAsDefault.description',
                        ),
                        type: 'boolean',
                        onChange: (value: boolean) => {
                            store.set(
                                'workspace.usePendantViewAsDefault',
                                value,
                            );
                            if (isElectron()) {
                                Confirm({
                                    title: i18n.t(
                                        'config:basics.usePendantViewAsDefault.restartTitle',
                                    ),
                                    content: value
                                        ? i18n.t(
                                              'config:basics.usePendantViewAsDefault.restartToPendant',
                                          )
                                        : i18n.t(
                                              'config:basics.usePendantViewAsDefault.restartToDesktop',
                                          ),
                                    confirmLabel: i18n.t(
                                        'config:basics.usePendantViewAsDefault.restartNow',
                                    ),
                                    cancelLabel: i18n.t(
                                        'config:basics.usePendantViewAsDefault.restartLater',
                                    ),
                                    onConfirm: () => {
                                        (window as any).ipcRenderer.send(
                                            'remoteMode-restart',
                                        );
                                    },
                                });
                            }
                        },
                    },
                    {
                        label: tk('config:basics.droZeros.label'),
                        key: 'workspace.customDecimalPlaces',
                        description: tk('config:basics.droZeros.description'),
                        type: 'number',
                        min: 0,
                        max: 4,
                    },
                ],
            },
            {
                label: tk('config:basics.visualizerOptionsGroup'),
                settings: [
                    {
                        label: tk('config:basics.visualizerTheme.label'),
                        key: 'widgets.visualizer.theme',
                        description: tk(
                            'config:basics.visualizerTheme.description',
                        ),
                        type: 'select',
                        options: [
                            THEMES.LIGHT_THEME,
                            THEMES.DARK_THEME,
                            THEMES.FLEXOKI_DARK_THEME,
                            THEMES.TOKYO_NIGHT_THEME,
                            THEMES.GRUVBOX_LIGHT_THEME,
                            THEMES.AYU_DARK_THEME,
                            THEMES.AYU_LIGHT_THEME,
                        ],
                        onChange: (theme: THEMES_T) => {
                            pubsub.publish('theme:change', theme);
                        },
                    },
                    {
                        label: tk('config:basics.cameraProjection.label'),
                        key: 'widgets.visualizer.projection',
                        description: tk(
                            'config:basics.cameraProjection.description',
                        ),
                        type: 'select',
                        options: ['Perspective', 'Orthographic'],
                        labels: [
                            tk('config:options.projection.perspective'),
                            tk('config:options.projection.orthographic'),
                        ],
                        onChange: (value: string) => {
                            store.set('widgets.visualizer.projection', value);
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk('config:basics.showBoundingBox.label'),
                        key: 'widgets.visualizer.objects.limits.visible',
                        description: tk(
                            'config:basics.showBoundingBox.description',
                        ),
                        type: 'boolean',
                        onChange: (value: boolean) => {
                            store.set(
                                'widgets.visualizer.objects.limits.visible',
                                value,
                            );
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk('config:basics.showBoundingBoxLabels.label'),
                        key: 'widgets.visualizer.boundingBoxLabels',
                        description: tk(
                            'config:basics.showBoundingBoxLabels.description',
                        ),
                        type: 'boolean',
                        onChange: (value: boolean) => {
                            store.set(
                                'widgets.visualizer.boundingBoxLabels',
                                value,
                            );
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk(
                            'config:basics.showMachineBedIndicator.label',
                        ),
                        key: 'widgets.visualizer.objects.machineBed.visible',
                        description: tk(
                            'config:basics.showMachineBedIndicator.description',
                        ),
                        type: 'boolean',
                        defaultValue: false,
                        onChange: (value: boolean) => {
                            store.set(
                                'widgets.visualizer.objects.machineBed.visible',
                                value,
                            );
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk('config:basics.trimGridToMachineBed.label'),
                        key: 'widgets.visualizer.objects.machineBed.trimGridToBed',
                        description: tk(
                            'config:basics.trimGridToMachineBed.description',
                        ),
                        type: 'boolean',
                        defaultValue: false,
                        onChange: (value: boolean) => {
                            store.set(
                                'widgets.visualizer.objects.machineBed.trimGridToBed',
                                value,
                            );
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk('config:basics.hideProcessedLines.label'),
                        key: 'widgets.visualizer.hideProcessedLines',
                        description: tk(
                            'config:basics.hideProcessedLines.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.showPlannedLines.label'),
                        key: 'widgets.visualizer.showPlannedLines',
                        description: tk(
                            'config:basics.showPlannedLines.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.animatePlannedLines.label'),
                        key: 'widgets.visualizer.animatePlannedLines',
                        description: tk(
                            'config:basics.animatePlannedLines.description',
                        ),
                        type: 'boolean',
                        defaultValue: false,
                        onChange: (value: boolean) => {
                            store.set(
                                'widgets.visualizer.animatePlannedLines',
                                value,
                            );
                            pubsub.publish('visualizer:settings');
                        },
                    },
                    {
                        label: tk('config:basics.lightweightOptions.label'),
                        key: 'widgets.visualizer.liteOption',
                        description: tk(
                            'config:basics.lightweightOptions.description',
                        ),
                        type: 'select',
                        options: [
                            LIGHTWEIGHT_OPTIONS.LIGHT,
                            LIGHTWEIGHT_OPTIONS.EVERYTHING,
                        ],
                        labels: [
                            tk('config:options.lightweight.light'),
                            tk('config:options.lightweight.everything'),
                        ],
                    },
                    {
                        label: tk(
                            'config:basics.followToolDuringRuntime.label',
                        ),
                        key: 'widgets.visualizer.followToolDuringRuntime',
                        description: tk(
                            'config:basics.followToolDuringRuntime.description',
                        ),
                        type: 'boolean',
                        defaultValue: false,
                    },
                    {
                        label: tk('config:basics.portraitMacroBar.label'),
                        key: 'workspace.portraitMacroBar',
                        description: tk(
                            'config:basics.portraitMacroBar.description',
                        ),
                        type: 'boolean',
                        defaultValue: false,
                    },
                ],
            },
            {
                label: tk('config:basics.joggingPresetsGroup'),
                settings: [
                    {
                        label: tk('config:basics.rapid.label'),
                        type: 'jog',
                        description: '',
                        key: 'widgets.axes.jog.rapid',
                    },
                    {
                        label: tk('config:basics.normal.label'),
                        type: 'jog',
                        description: tk('config:basics.normal.description'),
                        key: 'widgets.axes.jog.normal',
                    },
                    {
                        label: tk('config:basics.precise.label'),
                        type: 'jog',
                        description: '',
                        key: 'widgets.axes.jog.precise',
                    },
                    {
                        label: tk('config:basics.continuousJogDelay.label'),
                        type: 'number',
                        unit: 'ms',
                        description: tk(
                            'config:basics.continuousJogDelay.description',
                        ),
                        key: 'widgets.axes.jog.threshold',
                        min: 50,
                    },
                ],
            },
            {
                label: tk('config:basics.notificationsGroup'),
                settings: [
                    {
                        label: tk('config:basics.warnIfBadFile.label'),
                        key: 'widgets.visualizer.showWarning',
                        description: tk(
                            'config:basics.warnIfBadFile.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.warnOnBadLine.label'),
                        key: 'widgets.visualizer.showLineWarnings',
                        description: tk(
                            'config:basics.warnOnBadLine.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.warnWhenSettingZero.label'),
                        key: 'workspace.shouldWarnZero',
                        description: tk(
                            'config:basics.warnWhenSettingZero.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:basics.warnIfBeyondSoftLimits.label'),
                        key: 'widgets.visualizer.showSoftLimitWarning',
                        description: tk(
                            'config:basics.warnIfBeyondSoftLimits.description',
                        ),
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
                        label: tk('config:basics.jobEndNotifications.label'),
                        key: 'widgets.visualizer.jobEndModal',
                        description: tk(
                            'config:basics.jobEndNotifications.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk(
                            'config:basics.maintenanceNotifications.label',
                        ),
                        key: 'widgets.visualizer.maintenanceTaskNotifications',
                        description: tk(
                            'config:basics.maintenanceNotifications.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk(
                            'config:basics.popUpNotificationDuration.label',
                        ),
                        key: 'workspace.toastDuration',
                        // Text mentions TOASTER_UNTIL_CLOSE (-1) and TOASTER_DISABLED (-2) literally.
                        description: tk(
                            'config:basics.popUpNotificationDuration.description',
                        ),
                        type: 'number',
                        defaultValue: 0,
                        min: TOASTER_DISABLED,
                        max: TOASTER_LONG,
                    },
                ],
            },
            {
                label: tk('config:basics.shortcutsGroup'),
                settings: [
                    {
                        label: tk('config:basics.keyboard.label'),
                        type: 'wizard',
                        wizard: KeyboardLinkWizard,
                        description: tk('config:basics.keyboard.description'),
                    },
                    {
                        label: tk('config:basics.gamepad.label'),
                        type: 'wizard',
                        wizard: GamepadLinkWizard,
                        description: tk('config:basics.gamepad.description'),
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:customizeUi.title'),
        icon: MdSettingsApplications,
        settings: [],
    },
    {
        label: tk('config:motors.title'),
        icon: PiEngine,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'wizard',
                        wizard: SquaringToolWizard,
                        label: tk('config:motors.squareUpCncRails.label'),
                        description: tk(
                            'config:motors.squareUpCncRails.description',
                        ),
                        hidden: () => {
                            const connected = controller.portOpen;
                            return !connected;
                        },
                    },
                    {
                        type: 'eeprom',
                        eID: '$3',
                    },
                    {
                        type: 'eeprom',
                        eID: '$37',
                    },
                    {
                        type: 'eeprom',
                        eID: '$680',
                    },
                ],
            },
            {
                label: tk('config:motors.xAxisGroup'),
                wizard: XJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$100',
                        toolLink: tk('config:wizards.tuneCorrection'),
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
                label: tk('config:motors.yAxisGroup'),
                wizard: YJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$8',
                    },
                    {
                        type: 'eeprom',
                        eID: '$101',
                        toolLink: tk('config:wizards.tuneCorrection'),
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
                label: tk('config:motors.zAxisGroup'),
                wizard: ZJogWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$102',
                        toolLink: tk('config:wizards.tuneCorrection'),
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
        label: tk('config:probe.title'),
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
                        label: tk('config:probe.touchPlateType.label'),
                        key: 'workspace.probeProfile.touchplateType',
                        type: 'select',
                        description: tk(
                            'config:probe.touchPlateType.description',
                        ),
                        options: [
                            TOUCHPLATE_TYPE_STANDARD,
                            TOUCHPLATE_TYPE_AUTOZERO,
                            TOUCHPLATE_TYPE_ZERO,
                            TOUCHPLATE_TYPE_3D,
                            TOUCHPLATE_TYPE_BITZERO,
                        ],
                    },
                    {
                        label: tk('config:probe.showTouchPlateSwitcher.label'),
                        key: 'widgets.probe.touchplateTypeSwitcher',
                        description: tk(
                            'config:probe.showTouchPlateSwitcher.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:probe.tipDiameter.label'),
                        key: 'widgets.probe.tipDiameter3D',
                        description: tk('config:probe.tipDiameter.description'),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using 3D probe
                            return probeType !== TOUCHPLATE_TYPE_3D;
                        },
                    },
                    {
                        label: tk('config:probe.blockThickness.label'),
                        key: 'workspace.probeProfile.zThickness.standardBlock',
                        description: tk(
                            'config:probe.blockThickness.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using Block touchplate
                            return probeType !== TOUCHPLATE_TYPE_STANDARD;
                        },
                    },
                    {
                        label: tk('config:probe.autozeroThickness.label'),
                        key: 'workspace.probeProfile.zThickness.autoZero',
                        description: tk(
                            'config:probe.autozeroThickness.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using AutoZero touchplate
                            return probeType !== TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: tk('config:probe.puckThickness.label'),
                        key: 'workspace.probeProfile.zThickness.zProbe',
                        description: tk(
                            'config:probe.puckThickness.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using Puck touchplate
                            return probeType !== TOUCHPLATE_TYPE_ZERO;
                        },
                    },
                    {
                        label: tk('config:probe.zOffset.label'),
                        key: 'workspace.probeProfile.zThickness.probe3D',
                        description: tk('config:probe.zOffset.description'),
                        type: 'number',
                        unit: 'mm',
                        defaultValue: 0,
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using 3D probe
                            return probeType !== TOUCHPLATE_TYPE_3D;
                        },
                    },
                    {
                        label: tk('config:probe.bitzeroThicknessXyz.label'),
                        key: 'workspace.probeProfile.zThickness.bitZero',
                        description: tk(
                            'config:probe.bitzeroThicknessXyz.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using BitZero
                            return probeType !== TOUCHPLATE_TYPE_BITZERO;
                        },
                    },
                    {
                        label: tk('config:probe.bitzeroThicknessZOnly.label'),
                        key: 'workspace.probeProfile.zThickness.bitZeroZOnly',
                        description: tk(
                            'config:probe.bitzeroThicknessZOnly.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using BitZero
                            return probeType !== TOUCHPLATE_TYPE_BITZERO;
                        },
                    },
                    {
                        label: tk('config:probe.xyThickness.label'),
                        key: 'workspace.probeProfile.xyThickness',
                        description: tk('config:probe.xyThickness.description'),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using Block touchplate
                            return probeType !== TOUCHPLATE_TYPE_STANDARD;
                        },
                    },
                    {
                        label: tk('config:probe.xyRetract.label'),
                        key: 'widgets.probe.xyRetract3D',
                        description: tk('config:probe.xyRetract.description'),
                        type: 'number',
                        unit: 'mm',
                        defaultValue: 10,
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are not using 3D probe
                            return probeType !== TOUCHPLATE_TYPE_3D;
                        },
                    },
                    {
                        label: tk('config:probe.zProbeDistance.label'),
                        key: 'widgets.probe.zProbeDistance',
                        description: tk(
                            'config:probe.zProbeDistance.description',
                        ),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return (
                                probeType === TOUCHPLATE_TYPE_AUTOZERO ||
                                probeType === TOUCHPLATE_TYPE_BITZERO
                            );
                        },
                    },
                    {
                        label: tk('config:probe.fastFind.label'),
                        key: 'widgets.probe.probeFastFeedrate',
                        description: tk('config:probe.fastFind.description'),
                        type: 'number',
                        unit: 'mm/min',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return (
                                probeType === TOUCHPLATE_TYPE_AUTOZERO ||
                                probeType === TOUCHPLATE_TYPE_BITZERO
                            );
                        },
                    },
                    {
                        label: tk('config:probe.slowFind.label'),
                        key: 'widgets.probe.probeFeedrate',
                        description: tk('config:probe.slowFind.description'),
                        type: 'number',
                        unit: 'mm/min',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return (
                                probeType === TOUCHPLATE_TYPE_AUTOZERO ||
                                probeType === TOUCHPLATE_TYPE_BITZERO
                            );
                        },
                    },
                    {
                        label: tk('config:probe.retraction.label'),
                        key: 'widgets.probe.retractionDistance',
                        description: tk('config:probe.retraction.description'),
                        type: 'number',
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return (
                                probeType === TOUCHPLATE_TYPE_AUTOZERO ||
                                probeType === TOUCHPLATE_TYPE_BITZERO
                            );
                        },
                    },
                    {
                        label: tk('config:probe.probeMovementSpeed.label'),
                        key: 'widgets.probe.probeMovementSpeed',
                        description: tk(
                            'config:probe.probeMovementSpeed.description',
                        ),
                        type: 'number',
                        min: 0,
                        unit: 'mm/min',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // BitZero already always uses G1 for retracts, so this setting doesn't apply to it
                            return probeType === TOUCHPLATE_TYPE_BITZERO;
                        },
                    },
                    {
                        label: tk('config:probe.finalZRetract.label'),
                        key: 'widgets.probe.zRetractNormal',
                        description: tk(
                            'config:probe.finalZRetract.description',
                        ),
                        type: 'number',
                        min: 1,
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return (
                                probeType === TOUCHPLATE_TYPE_AUTOZERO ||
                                probeType === TOUCHPLATE_TYPE_BITZERO
                            );
                        },
                    },
                    {
                        label: tk('config:probe.finalZRetract2.label'),
                        key: 'widgets.probe.zRetractAuto',
                        description: tk(
                            'config:probe.finalZRetract2.description',
                        ),
                        type: 'number',
                        min: 1,
                        unit: 'mm',
                        hidden: (getPending) => {
                            const probeType = getPending(
                                'workspace.probeProfile.touchplateType',
                                '',
                            );
                            // Hidden if we are using AutoZero or BitZero touchplate
                            return probeType !== TOUCHPLATE_TYPE_AUTOZERO;
                        },
                    },
                    {
                        label: tk('config:probe.connectionTest.label'),
                        key: 'widgets.probe.connectivityTest',
                        description: tk(
                            'config:probe.connectionTest.description',
                        ),
                        type: 'boolean',
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:actionButtons.title'),
        icon: RxButton,
        settings: [
            {
                label: '',
                settings: [
                    { type: 'eeprom', eID: '$450', remap: '$590' },
                    { type: 'eeprom', eID: '$451', remap: '$591' },
                    { type: 'eeprom', eID: '$452', remap: '$592' },
                    { type: 'eeprom', eID: '$453', remap: '$490' },
                    { type: 'eeprom', eID: '$454', remap: '$491' },
                    { type: 'eeprom', eID: '$455', remap: '$492' },
                ],
            },
        ],
    },
    {
        label: tk('config:homingLimits.title'),
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
                        label: tk(
                            'config:homingLimits.stopJoggingPastLimits.label',
                        ),
                        key: 'workspace.preventJoggingPastLimits',
                        type: 'boolean',
                        description: tk(
                            'config:homingLimits.stopJoggingPastLimits.description',
                        ),
                    },
                    {
                        type: 'eeprom',
                        eID: '$21',
                    },
                ],
            },
            {
                label: tk('config:homingLimits.homingBehaviourGroup'),
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
                        min: 0,
                    },
                    {
                        type: 'eeprom',
                        eID: '$290',
                    },
                    {
                        type: 'eeprom',
                        eID: '$291',
                    },
                    {
                        type: 'eeprom',
                        eID: '$292',
                    },
                    {
                        type: 'eeprom',
                        eID: '$293',
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
                label: tk('config:homingLimits.parkingGroup'),
                settings: [
                    {
                        label: tk('config:homingLimits.parkLocation.label'),
                        key: 'workspace.park',
                        type: 'location',
                        unit: 'mm',
                        description: tk(
                            'config:homingLimits.parkLocation.description',
                        ),
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:spindleLaser.title'),
        icon: GiTargetLaser,
        wizard: SpindleWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'boolean',
                        label: tk(
                            'config:spindleLaser.spindleLaserControls.label',
                        ),
                        description: tk(
                            'config:spindleLaser.spindleLaserControls.description',
                        ),
                        key: 'workspace.spindleFunctions',
                        onUpdate: () => {
                            const spindleFunctions = store.get(
                                'workspace.spindleFunctions',
                            );
                            const mode: SPINDLE_LASER_T = store.get(
                                'widgets.spindle.mode',
                                SPINDLE_MODE,
                            );

                            // if we are turning off the spindle tab, set to spindle mode
                            if (!spindleFunctions && mode === LASER_MODE) {
                                const preferredUnits =
                                    store.get('workspace.units') ===
                                    IMPERIAL_UNITS
                                        ? 'G20'
                                        : 'G21';
                                const active: boolean =
                                    get(
                                        reduxStore.getState(),
                                        'state.controller.modal.spindle',
                                        'M5',
                                    ) !== 'M5';
                                const controllerType: FIRMWARE_TYPES_T = get(
                                    reduxStore.getState(),
                                    'state.controller.type',
                                    'grbl',
                                );
                                const availableSpindles: Spindle[] = get(
                                    reduxStore.getState(),
                                    'state.controller.spindles',
                                    [],
                                );
                                const units: UNITS_GCODE = get(
                                    reduxStore.getState(),
                                    'state.controller.modal.units',
                                );
                                const spindleMin = Number(
                                    get(
                                        reduxStore.getState(),
                                        'state.controller.settings.settings.$31',
                                        1000,
                                    ),
                                );
                                const spindleMax = Number(
                                    get(
                                        reduxStore.getState(),
                                        'state.controller.settings.settings.$30',
                                        30000,
                                    ),
                                );
                                const laser: LaserState = store.get(
                                    'widgets.spindle.laser',
                                    {
                                        maxPower: 0,
                                        minPower: 0,
                                    },
                                );

                                // get previously saved spindle values
                                const prevSpindleMin = store.get(
                                    'widgets.spindle.spindleMin',
                                    0,
                                );
                                const prevSpindleMax = store.get(
                                    'widgets.spindle.spindleMax',
                                    0,
                                );

                                const SLBLaserExists =
                                    controllerType === GRBLHAL &&
                                    findIndex(
                                        availableSpindles,
                                        (o) => o.label === 'SLB_LASER',
                                    ) !== -1;

                                const calculateAdjustedOffsets = (
                                    xOffset: number,
                                    yOffset: number,
                                    units: UNITS_GCODE | UNITS_EN,
                                ): [number, number] => {
                                    const $13: string = get(
                                        reduxStore.getState(),
                                        'state.controller.settings.settings.$13',
                                        '0',
                                    );
                                    const wpos: BasicPosition = get(
                                        reduxStore.getState(),
                                        'state.controller.wpos',
                                        { x: 0, y: 0, z: 0 },
                                    );
                                    let { x, y } = wpos;

                                    if ($13 === '1' || units === 'G20') {
                                        units = 'G20';
                                        x /= 25.4;
                                        y /= 25.4;
                                    }
                                    return [
                                        round(
                                            Number(x) + Number(xOffset),
                                            units,
                                        ),
                                        round(
                                            Number(y) + Number(yOffset),
                                            units,
                                        ),
                                    ];
                                };

                                const getSpindleOffsetCode = (
                                    preferredUnits: UNITS_GCODE | UNITS_EN,
                                ): string[] => {
                                    const laserXOffset = Number(
                                        get(
                                            reduxStore.getState(),
                                            'state.controller.settings.settings.$741',
                                            0,
                                        ),
                                    );
                                    const laserYOffset = Number(
                                        get(
                                            reduxStore.getState(),
                                            'state.controller.settings.settings.$742',
                                            0,
                                        ),
                                    );
                                    const wcs: string = get(
                                        reduxStore.getState(),
                                        'state.controller.modal.wcs',
                                        '',
                                    );
                                    const currentWCS: number =
                                        {
                                            G54: 1,
                                            G55: 2,
                                            G56: 3,
                                            G57: 4,
                                            G58: 5,
                                            G59: 6,
                                        }[wcs] || 0;

                                    let offsetQuery = [];

                                    let { xOffset, yOffset } = laser;

                                    // If using grblHAL AND SLB_LASER, use the eeprom laser offset values
                                    if (controllerType === GRBLHAL) {
                                        xOffset = laserXOffset;
                                        yOffset = laserYOffset;
                                    }

                                    xOffset = Number(xOffset) * -1;
                                    yOffset = Number(yOffset) * -1;
                                    if (preferredUnits === 'G20') {
                                        xOffset = convertToImperial(xOffset);
                                        yOffset = convertToImperial(yOffset);
                                    } else {
                                        xOffset = roundMetric(xOffset);
                                        yOffset = roundMetric(yOffset);
                                    }

                                    const [xoffsetAdjusted, yOffsetAdjusted] =
                                        calculateAdjustedOffsets(
                                            xOffset,
                                            yOffset,
                                            preferredUnits,
                                        );
                                    if (xOffset === 0 && yOffset !== 0) {
                                        offsetQuery = [
                                            `G10 L20 P${currentWCS} Y${yOffsetAdjusted}`,
                                        ];
                                    } else if (xOffset !== 0 && yOffset === 0) {
                                        offsetQuery = [
                                            `G10 L20 P${currentWCS} X${xoffsetAdjusted}`,
                                        ];
                                    } else if (xOffset !== 0 && yOffset !== 0) {
                                        offsetQuery = [
                                            `G10 L20 P${currentWCS} X${xoffsetAdjusted} Y${yOffsetAdjusted}`,
                                        ];
                                    } else {
                                        offsetQuery = [''];
                                    }

                                    return offsetQuery;
                                };

                                // set mode to spindle
                                store.set('widgets.spindle.mode', 'spindle');

                                // save current laser values if laser spindle doesnt exist
                                if (!SLBLaserExists) {
                                    laser.maxPower = spindleMax;
                                    laser.minPower = spindleMin;
                                    store.set('widgets.spindle.laser', laser);
                                }

                                const powerCommands = SLBLaserExists
                                    ? []
                                    : [
                                          `$30=${prevSpindleMax}`,
                                          `$31=${prevSpindleMin}`,
                                      ];

                                if (active) {
                                    controller.command('gcode', 'M5');
                                }

                                const commands = [
                                    preferredUnits,
                                    ...getSpindleOffsetCode(preferredUnits),
                                    ...powerCommands,
                                    '$32=0',
                                    units,
                                ];

                                // only update max/min if slb laser doesnt exist
                                if (!SLBLaserExists) {
                                    reduxStore.dispatch(
                                        updatePartialControllerSettings({
                                            $30: prevSpindleMax.toString(),
                                            $31: prevSpindleMin.toString(),
                                            $32: '0',
                                        }),
                                    );
                                } else {
                                    // update only laser/spindle mode eeprom if slb laser exists
                                    reduxStore.dispatch(
                                        updatePartialControllerSettings({
                                            $32: '0',
                                        }),
                                    );
                                }

                                controller.command('gcode', commands);
                            }
                        },
                    },
                    {
                        type: 'eeprom',
                        eID: '$32',
                    },
                    {
                        type: 'eeprom',
                        eID: '$394',
                    },
                    {
                        type: 'eeprom',
                        eID: '$392',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.insertDwellForSpindleCommands.label',
                        ),
                        key: 'widgets.spindle.delay',
                        description: tk(
                            'config:spindleLaser.insertDwellForSpindleCommands.description',
                        ),
                        type: 'number',
                        unit: 's',
                        defaultValue: 0,
                        onUpdate: () => {
                            const delay = Number(
                                store.get('widgets.spindle.delay', 0),
                            );
                            controller.command('settings:updated', {
                                spindleDelay: Number.isFinite(delay)
                                    ? delay
                                    : 0,
                            });
                        },
                    },

                    {
                        type: 'eeprom',
                        eID: '$539',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.minimumSpindleSpeed.label',
                        ),
                        key: 'widgets.spindle.spindleMin',
                        description: tk(
                            'config:spindleLaser.minimumSpindleSpeed.description',
                        ),
                        type: 'hybrid',
                        eID: '$31',
                        forceEEPROM: true,
                        unit: 'rpm',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.maximumSpindleSpeed.label',
                        ),
                        key: 'widgets.spindle.spindleMax',
                        description: tk(
                            'config:spindleLaser.maximumSpindleSpeed.description',
                        ),
                        type: 'hybrid',
                        eID: '$30',
                        forceEEPROM: true,
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
                label: tk('config:spindleLaser.spindlePwmGroup'),
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
                    {
                        type: 'eeprom',
                        eID: '$709',
                    },
                ],
            },
            {
                label: tk('config:spindleLaser.spindleModbusGroup'),
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
                    {
                        type: 'eeprom',
                        eID: '$681',
                    },
                ],
            },
            {
                label: tk('config:spindleLaser.laserGroup'),
                wizard: LaserWizard,
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$743',
                        remap: '$716',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.minimumLaserPower.label',
                        ),
                        key: 'widgets.spindle.laser.minPower',
                        description: tk(
                            'config:spindleLaser.minimumLaserPower.description',
                        ),
                        type: 'hybrid',
                        eID: '$731',
                        unit: '',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.maximumLaserPower.label',
                        ),
                        key: 'widgets.spindle.laser.maxPower',
                        description: tk(
                            'config:spindleLaser.maximumLaserPower.description',
                        ),
                        type: 'hybrid',
                        eID: '$730',
                        unit: '',
                    },
                    {
                        label: tk(
                            'config:spindleLaser.laserOnDuringOutline.label',
                        ),
                        key: 'widgets.spindle.laser.laserOnOutline',
                        type: 'boolean',
                        description: tk(
                            'config:spindleLaser.laserOnDuringOutline.description',
                        ),
                    },
                    {
                        label: tk('config:spindleLaser.laserXOffset.label'),
                        key: 'widgets.spindle.laser.xOffset',
                        description: tk(
                            'config:spindleLaser.laserXOffset.description',
                        ),
                        type: 'hybrid',
                        eID: '$741',
                        remap: '$770',
                        unit: 'mm',
                    },
                    {
                        label: tk('config:spindleLaser.laserYOffset.label'),
                        key: 'widgets.spindle.laser.yOffset',
                        description: tk(
                            'config:spindleLaser.laserYOffset.description',
                        ),
                        type: 'hybrid',
                        eID: '$742',
                        remap: '$771',
                        unit: 'mm',
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
        label: tk('config:accessoryOutputs.title'),
        icon: CiMapPin,
        wizard: AccessoryOutputWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: tk(
                            'config:accessoryOutputs.coolantControls.label',
                        ),
                        key: 'workspace.coolantFunctions',
                        description: tk(
                            'config:accessoryOutputs.coolantControls.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        type: 'eeprom',
                        eID: '$673',
                    },
                    { type: 'eeprom', eID: '$456', remap: '$750' },
                    { type: 'eeprom', eID: '$457', remap: '$751' },
                    { type: 'eeprom', eID: '$458', remap: '$752' },
                    { type: 'eeprom', eID: '$459', remap: '$753' },
                    { type: 'eeprom', eID: '$754' },
                    { type: 'eeprom', eID: '$755' },
                    { type: 'eeprom', eID: '$756' },
                    { type: 'eeprom', eID: '$757' },
                    { type: 'eeprom', eID: '$758' },
                    { type: 'eeprom', eID: '$759' },
                    { type: 'eeprom', eID: '$760' },
                    { type: 'eeprom', eID: '$761' },
                    { type: 'eeprom', eID: '$762' },
                    { type: 'eeprom', eID: '$763' },
                    { type: 'eeprom', eID: '$764' },
                    { type: 'eeprom', eID: '$765' },
                    { type: 'eeprom', eID: '$766' },
                    { type: 'eeprom', eID: '$767' },
                    { type: 'eeprom', eID: '$768' },
                    { type: 'eeprom', eID: '$769' },
                ],
            },
        ],
    },
    {
        label: tk('config:rotary.title'),
        icon: FaArrowsSpin,
        wizard: AJogWizard,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: tk('config:rotary.rotaryControls.label'),
                        key: 'widgets.rotary.tab.show',
                        description: tk(
                            'config:rotary.rotaryControls.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            // when tab is turned off, turn off rotary mode
                            const mode = store.get('workspace.mode');
                            const showTab = store.get(
                                'widgets.rotary.tab.show',
                            );
                            if (!showTab && mode === WORKSPACE_MODE.ROTARY) {
                                updateWorkspaceMode(WORKSPACE_MODE.DEFAULT);
                            }
                        },
                    },
                    { type: 'eeprom', eID: '$376' },
                    {
                        label: tk('config:rotary.resolution.label'),
                        key: 'workspace.rotaryAxis.firmwareSettings.$101',
                        description: tk('config:rotary.resolution.description'),
                        type: 'hybrid',
                        eID: '$103',
                        unit: 'step/deg',
                    },
                    {
                        label: tk('config:rotary.maxSpeed.label'),
                        key: 'workspace.rotaryAxis.firmwareSettings.$111',
                        description: tk('config:rotary.maxSpeed.description'),
                        type: 'hybrid',
                        eID: '$113',
                        unit: 'deg/min',
                    },
                    { type: 'eeprom', eID: '$123' },
                    {
                        label: tk('config:rotary.forceSoftLimits.label'),
                        key: 'workspace.rotaryAxis.firmwareSettings.$20',
                        description: tk(
                            'config:rotary.forceSoftLimits.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:rotary.forceHardLimits.label'),
                        key: 'workspace.rotaryAxis.firmwareSettings.$21',
                        description: tk(
                            'config:rotary.forceHardLimits.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        type: 'eeprom',
                        eID: '$538',
                    },
                    {
                        label: tk(
                            'config:rotary.visualizeNonCenterZeros.label',
                        ),
                        key: 'widgets.visualizer.rotaryDiameterOffsetEnabled',
                        description: tk(
                            'config:rotary.visualizeNonCenterZeros.description',
                        ),
                        type: 'boolean',
                    },
                    {
                        label: tk('config:rotary.useAAxisForGrbl.label'),
                        type: 'boolean',
                        description: tk(
                            'config:rotary.useAAxisForGrbl.description',
                        ),
                        key: 'workspace.rotaryAxis.useAaxisForGrbl',
                        onUpdate: () => {
                            const useAaxisForGrbl = store.get(
                                'workspace.rotaryAxis.useAaxisForGrbl',
                                false,
                            );
                            controller.command('settings:updated', {
                                useAaxisForGrbl,
                            });
                        },
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:automations.title'),
        icon: FaRobot,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: tk('config:automations.fileStart.label'),
                        type: 'event',
                        eventType: 'gcode:start',
                        description: tk(
                            'config:automations.fileStart.description',
                        ),
                    },
                    {
                        label: tk('config:automations.filePause.label'),
                        type: 'event',
                        eventType: 'gcode:pause',
                        description: tk(
                            'config:automations.filePause.description',
                        ),
                    },
                    {
                        label: tk('config:automations.fileResume.label'),
                        type: 'event',
                        eventType: 'gcode:resume',
                        description: tk(
                            'config:automations.fileResume.description',
                        ),
                    },
                    {
                        label: tk('config:automations.fileStopEnd.label'),
                        type: 'event',
                        eventType: 'gcode:stop',
                        description: tk(
                            'config:automations.fileStopEnd.description',
                        ),
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:toolChanging.title'),
        icon: IoIosSwap,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'boolean',
                        label: tk(
                            'config:toolChanging.enableAtcControls.label',
                        ),
                        key: 'workspace.atcEnabled',
                        description: tk(
                            'config:toolChanging.enableAtcControls.description',
                        ),
                    },
                    {
                        label: tk('config:toolChanging.passthrough.label'),
                        type: 'boolean',
                        key: 'workspace.toolChange.passthrough',
                        description: tk(
                            'config:toolChanging.passthrough.description',
                        ),
                        onApply: () => {
                            updateToolchangeContext();
                        },
                    },
                    {
                        label: tk('config:toolChanging.gsenderStrategy.label'),
                        type: 'select',
                        description: tk(
                            'config:toolChanging.gsenderStrategy.description',
                        ),
                        options: [
                            'Ignore',
                            'Pause',
                            'Standard Re-zero',
                            'Flexible Re-zero',
                            'Fixed Tool Sensor',
                            'Code',
                        ],
                        labels: [
                            tk('config:options.toolChangeStrategy.ignore'),
                            tk('config:options.toolChangeStrategy.pause'),
                            tk(
                                'config:options.toolChangeStrategy.standardRezero',
                            ),
                            tk(
                                'config:options.toolChangeStrategy.flexibleRezero',
                            ),
                            tk(
                                'config:options.toolChangeStrategy.fixedToolSensor',
                            ),
                            tk('config:options.toolChangeStrategy.code'),
                        ],
                        key: 'workspace.toolChangeOption',
                    },
                    {
                        label: tk('config:toolChanging.skipDialog.label'),
                        type: 'boolean',
                        key: 'workspace.toolChange.skipDialog',
                        description: tk(
                            'config:toolChanging.skipDialog.description',
                        ),
                    },
                    {
                        label: tk(
                            'config:toolChanging.fixedSensorLocation.label',
                        ),
                        type: 'location',
                        key: 'workspace.toolChangePosition',
                        unit: 'mm',
                        description: tk(
                            'config:toolChanging.fixedSensorLocation.description',
                        ),
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Fixed Tool Sensor';
                        },
                    },
                    {
                        label: tk(
                            'config:toolChanging.firstToolBehaviour.label',
                        ),
                        type: 'select',
                        key: 'workspace.toolChange.firstToolBehaviour',
                        description: tk(
                            'config:toolChanging.firstToolBehaviour.description',
                        ),
                        options: [
                            'Always run full wizard',
                            'Prompt for first tool',
                            'Always probe length only',
                        ],
                        labels: [
                            tk(
                                'config:options.firstToolBehaviour.alwaysRunFullWizard',
                            ),
                            tk(
                                'config:options.firstToolBehaviour.promptForFirstTool',
                            ),
                            tk(
                                'config:options.firstToolBehaviour.alwaysProbeLengthOnly',
                            ),
                        ],
                        defaultValue: 'Always run full wizard',
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Fixed Tool Sensor';
                        },
                    },
                    {
                        label: tk(
                            'config:toolChanging.setToolChangeLocation.label',
                        ),
                        type: 'boolean',
                        key: 'workspace.toolChange.moveToManualPosition',
                        description: tk(
                            'config:toolChanging.setToolChangeLocation.description',
                        ),
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Fixed Tool Sensor';
                        },
                    },
                    {
                        label: tk(
                            'config:toolChanging.manualToolChangeLocation.label',
                        ),
                        type: 'location',
                        key: 'workspace.toolChange.manualPosition',
                        unit: 'mm',
                        description: tk(
                            'config:toolChanging.manualToolChangeLocation.description',
                        ),
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            const moveToLocation = getPending(
                                'workspace.toolChange.moveToManualPosition',
                                false,
                            );
                            return (
                                strategy !== 'Fixed Tool Sensor' ||
                                !moveToLocation
                            );
                        },
                    },
                    {
                        label: tk('config:toolChanging.beforeToolChange.label'),
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.preHook',
                        description: tk(
                            'config:toolChanging.beforeToolChange.description',
                        ),
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Code';
                        },
                    },
                    {
                        label: tk('config:toolChanging.afterToolChange.label'),
                        type: 'textarea',
                        key: 'workspace.toolChangeHooks.postHook',
                        description: tk(
                            'config:toolChanging.afterToolChange.description',
                        ),
                        hidden: (getPending) => {
                            const strategy = getPending(
                                'workspace.toolChangeOption',
                                '',
                            );
                            return strategy !== 'Code';
                        },
                    },
                    {
                        type: 'eeprom',
                        eID: '$675',
                    },
                ],
            },
            {
                label: tk('config:toolChanging.keepoutGroup'),
                settings: [
                    {
                        type: 'boolean',
                        label: tk('config:toolChanging.warnOnHome.label'),
                        description: tk(
                            'config:toolChanging.warnOnHome.description',
                        ),
                        key: 'widgets.atc.warnOnHome',
                    },
                    { type: 'eeprom', eID: '$683' },
                    { type: 'eeprom', eID: '$684' },
                    { type: 'eeprom', eID: '$685' },
                    { type: 'eeprom', eID: '$686' },
                    { type: 'eeprom', eID: '$687' },
                    { type: 'eeprom', eID: '$688' },
                    { type: 'eeprom', eID: '$689' },
                ],
            },
        ],
    },
    {
        label: tk('config:ethernet.title'),
        icon: BsEthernet,
        settings: [
            {
                label: '',
                settings: [
                    {
                        label: tk('config:ethernet.connectToIp.label'),
                        key: 'widgets.connection.ip',
                        description: tk(
                            'config:ethernet.connectToIp.description',
                        ),
                        type: 'ip',
                    },
                    {
                        label: tk('config:ethernet.ethernetPort.label'),
                        key: 'widgets.connection.ethernetPort',
                        description: tk(
                            'config:ethernet.ethernetPort.description',
                        ),
                        type: 'number',
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
                    { type: 'eeprom', eID: '$535' },
                ],
            },
        ],
    },
    {
        label: tk('config:statusLights.title'),
        icon: CiLight,
        settings: [
            {
                label: '',
                settings: [
                    {
                        type: 'eeprom',
                        eID: '$664',
                        remap: '$536',
                    },
                    {
                        type: 'eeprom',
                        eID: '$665',
                        remap: '$537',
                    },
                ],
            },
        ],
    },
    {
        label: tk('config:advancedMotors.title'),
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
        label: tk('config:moreSettings.title'),
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
                    {
                        type: 'eeprom',
                        eID: '$534',
                    },
                    { type: 'eeprom', eID: '$650' },
                    { type: 'eeprom', eID: '$666' },
                    { type: 'eeprom', eID: '$676' },
                ],
            },
        ],
    },
    {
        label: tk('config:accessibility.title'),
        icon: MdAccessibility,
        settings: [
            {
                label: tk('config:accessibility.announcementsGroup'),
                settings: [
                    {
                        label: tk('config:accessibility.machineStatus.label'),
                        key: 'workspace.accessibility.statusAnnouncements',
                        description: tk(
                            'config:accessibility.machineStatus.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.jobProgress.label'),
                        key: 'workspace.accessibility.jobProgressAnnouncements',
                        description: tk(
                            'config:accessibility.jobProgress.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk(
                            'config:accessibility.progressIncrement.label',
                        ),
                        key: 'workspace.accessibility.jobProgressIncrement',
                        description: tk(
                            'config:accessibility.progressIncrement.description',
                        ),
                        type: 'number',
                        min: 1,
                        max: 50,
                        unit: '%',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.jobProgressAnnouncements',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                ],
            },
            {
                label: tk('config:accessibility.audioCuesGroup'),
                settings: [
                    {
                        label: tk('config:accessibility.enableAudioCues.label'),
                        key: 'workspace.accessibility.audioCues.enabled',
                        description: tk(
                            'config:accessibility.enableAudioCues.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk(
                            'config:accessibility.jobCompleteSound.label',
                        ),
                        key: 'workspace.accessibility.audioCues.jobComplete',
                        description: tk(
                            'config:accessibility.jobCompleteSound.description',
                        ),
                        type: 'boolean',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.audioCues.enabled',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.alarmSound.label'),
                        key: 'workspace.accessibility.audioCues.alarmTriggered',
                        description: tk(
                            'config:accessibility.alarmSound.description',
                        ),
                        type: 'boolean',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.audioCues.enabled',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.toolChangeSound.label'),
                        key: 'workspace.accessibility.audioCues.toolChange',
                        description: tk(
                            'config:accessibility.toolChangeSound.description',
                        ),
                        type: 'boolean',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.audioCues.enabled',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk(
                            'config:accessibility.probeSuccessSound.label',
                        ),
                        key: 'workspace.accessibility.audioCues.probeSuccess',
                        description: tk(
                            'config:accessibility.probeSuccessSound.description',
                        ),
                        type: 'boolean',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.audioCues.enabled',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                ],
            },
            {
                label: tk('config:accessibility.navigationAndVisualsGroup'),
                settings: [
                    {
                        label: tk('config:accessibility.focusRings.label'),
                        key: 'workspace.accessibility.focusRings',
                        description: tk(
                            'config:accessibility.focusRings.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.focusTrapping.label'),
                        key: 'workspace.accessibility.focusTrapping',
                        description: tk(
                            'config:accessibility.focusTrapping.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.reducedMotion.label'),
                        key: 'workspace.accessibility.reducedMotion',
                        description: tk(
                            'config:accessibility.reducedMotion.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk(
                            'config:accessibility.spindleSpeedInputType.label',
                        ),
                        key: 'widgets.spindle.inputType',
                        type: 'select',
                        description: tk(
                            'config:accessibility.spindleSpeedInputType.description',
                        ),
                        options: ['Slider', 'Number'],
                        labels: [
                            tk('config:options.spindleInputType.slider'),
                            tk('config:options.spindleInputType.number'),
                        ],
                        defaultValue: 'Slider',
                    },
                    {
                        label: tk('config:accessibility.appDisplayScale.label'),
                        key: 'workspace.accessibility.displayScaleFactor',
                        type: 'select',
                        options: [
                            '50%',
                            '67%',
                            '75%',
                            '100%',
                            '125%',
                            '150%',
                            '175%',
                            '200%',
                        ],
                        defaultValue: '100%',
                        description: tk(
                            'config:accessibility.appDisplayScale.description',
                        ),
                        hidden: () => !isElectron(),
                        onUpdate: () => {
                            if (isElectron()) {
                                const scaleFactorStr = store.get(
                                    'workspace.accessibility.displayScaleFactor',
                                    '100%',
                                );
                                // Normalize percentage to decimal (e.g., "100%" -> 1.0)
                                const scaleFactor =
                                    parseFloat(scaleFactorStr) / 100;
                                // @ts-expect-error
                                window.ipcRenderer.send(
                                    'save-display-scale',
                                    scaleFactor,
                                );
                            }
                        },
                    },
                ],
            },
            {
                label: tk('config:accessibility.visualizerGroup'),
                settings: [
                    {
                        label: tk('config:accessibility.keyboardControl.label'),
                        key: 'workspace.accessibility.visualizerKeyboardControl',
                        description: tk(
                            'config:accessibility.keyboardControl.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk('config:accessibility.jobSummary.label'),
                        key: 'workspace.accessibility.gcodeSummary.enabled',
                        description: tk(
                            'config:accessibility.jobSummary.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                    {
                        label: tk(
                            'config:accessibility.showSummaryVisually.label',
                        ),
                        key: 'workspace.accessibility.gcodeSummary.showVisually',
                        description: tk(
                            'config:accessibility.showSummaryVisually.description',
                        ),
                        type: 'boolean',
                        hidden: () =>
                            !store.get(
                                'workspace.accessibility.gcodeSummary.enabled',
                            ),
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                ],
            },
            {
                label: tk('config:accessibility.keyboardMapGroup'),
                settings: [
                    {
                        label: tk(
                            'config:accessibility.showKeyboardShortcutMap.label',
                        ),
                        key: 'workspace.accessibility.showKeyboardMap',
                        description: tk(
                            'config:accessibility.showKeyboardShortcutMap.description',
                        ),
                        type: 'boolean',
                        onUpdate: () => {
                            pubsub.publish('accessibility:update');
                        },
                    },
                ],
            },
        ],
    },
];
