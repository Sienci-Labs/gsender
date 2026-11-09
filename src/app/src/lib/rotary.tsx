import type {
    EEPROMSettings,
    FIRMWARE_TYPES_T,
    RotaryModeFirmwareSettings,
} from 'app/definitions/firmware';
import { i18n } from 'app/i18n';
import type { WORKSPACE_MODE_T } from 'app/workspace/definitions';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import { Confirm } from '../components/ConfirmationDialog/ConfirmationDialogLib';
import {
    DEFAULT_FIRMWARE_SETTINGS,
    GRBL,
    GRBLHAL,
    ROTARY_MODE_FIRMWARE_SETTINGS,
    ROTARY_TOGGLE_MACRO,
    WORKSPACE_MODE,
} from '../constants';
import store from '../store';
import { store as reduxStore } from '../store/redux';
import controller from './controller';
import { toast } from './toaster';

export const updateWorkspaceMode = (mode: WORKSPACE_MODE_T): void => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const firmwareType: FIRMWARE_TYPES_T = get(
        reduxStore.getState(),
        'controller.type',
    );
    const EEPROMSettings: EEPROMSettings = get(
        reduxStore.getState(),
        'controller.settings.settings',
    );
    const rotaryFirmwareSettings: RotaryModeFirmwareSettings = store.get(
        'workspace.rotaryAxis.firmwareSettings',
        ROTARY_MODE_FIRMWARE_SETTINGS,
    );

    store.replace('workspace.mode', mode);

    switch (mode) {
        case DEFAULT: {
            if (firmwareType === GRBL) {
                const defaultFirmwareSettings: RotaryModeFirmwareSettings =
                    store.get(
                        'workspace.rotaryAxis.defaultFirmwareSettings',
                        DEFAULT_FIRMWARE_SETTINGS,
                    );

                const defaultFirmwareSettingsArr = Object.entries(
                    defaultFirmwareSettings,
                ).map(([key, value]) => `${key}=${value}`);

                controller.command('gcode', [
                    ...defaultFirmwareSettingsArr,
                    '$$',
                    ROTARY_TOGGLE_MACRO,
                ]);
            } else if (firmwareType === GRBLHAL) {
                // switch A and Y axis settings back
                const newAAxisSettings = [
                    `$103=${get(reduxStore.getState(), 'controller.settings.settings.$101')}`,
                    `$113=${get(reduxStore.getState(), 'controller.settings.settings.$111')}`,
                    `$123=${get(reduxStore.getState(), 'controller.settings.settings.$121')}`,
                    `$133=${get(reduxStore.getState(), 'controller.settings.settings.$131')}`,
                ];
                const newYAxisSettings = [
                    `$101=${get(reduxStore.getState(), 'controller.settings.settings.$103')}`,
                    `$111=${get(reduxStore.getState(), 'controller.settings.settings.$113')}`,
                    `$121=${get(reduxStore.getState(), 'controller.settings.settings.$123')}`,
                    `$131=${get(reduxStore.getState(), 'controller.settings.settings.$133')}`,
                ];

                // zero y and enable rotary
                controller.command('gcode', [
                    'G10 L20 P1 Y0',
                    ...newAAxisSettings,
                    ...newYAxisSettings,
                    '$$',
                    ROTARY_TOGGLE_MACRO,
                ]);

                controller.command('updateRotaryMode', false);
            }
            return;
        }

        case ROTARY: {
            // We only need to update the firmware settings on grbl machines
            if (firmwareType === GRBL) {
                // save default settings
                const defaultFirmwareSettings = {
                    $101: EEPROMSettings.$101,
                    $111: EEPROMSettings.$111,
                    $20: EEPROMSettings.$20,
                    $21: EEPROMSettings.$21,
                };
                store.replace(
                    'workspace.rotaryAxis.defaultFirmwareSettings',
                    defaultFirmwareSettings,
                );

                // Convert to array to send to the controller, will look something like this: ["$101=26.667", ...]
                const rotaryFirmwareSettingsArr = Object.entries(
                    rotaryFirmwareSettings,
                ).map(([key, value]) => `${key}=${value}`);

                Confirm({
                    title: i18n.t('notifications:rotary.enable.title'),
                    cancelLabel: i18n.t('common:actions.cancel'),
                    confirmLabel: i18n.t('common:actions.ok'),
                    content: (
                        <div
                            style={{
                                textAlign: 'left',
                                width: '90%',
                                margin: 'auto',
                                fontSize: '1.25rem',
                            }}
                        >
                            <p>{i18n.t('notifications:rotary.enable.intro')}</p>

                            <ol>
                                <li style={{ marginBottom: '1rem' }}>
                                    {i18n.t(
                                        'notifications:rotary.enable.zeroY',
                                    )}
                                </li>
                                <li style={{ marginBottom: '1rem' }}>
                                    {i18n.t(
                                        'notifications:rotary.enable.limitsOff',
                                    )}
                                </li>
                                <li>
                                    <span>
                                        {i18n.t(
                                            'notifications:rotary.enable.updateFirmwareValues',
                                        )}
                                    </span>

                                    <ul style={{ marginTop: '0.5rem' }}>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.yTravelResolution',
                                                {
                                                    setting: '$101',
                                                },
                                            )}
                                        </li>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.yMaximumRate',
                                                {
                                                    setting: '$111',
                                                },
                                            )}
                                        </li>
                                    </ul>
                                </li>
                            </ol>

                            <p>
                                {i18n.t(
                                    'notifications:rotary.enable.checkWiring',
                                )}
                            </p>
                        </div>
                    ),
                    onConfirm: () => {
                        // zero y and enable rotary
                        controller.command('gcode', [
                            'G10 L20 P1 Y0',
                            ...rotaryFirmwareSettingsArr,
                            '$$',
                            ROTARY_TOGGLE_MACRO,
                        ]);

                        pubsub.publish('visualizer:updateposition', { y: 0 });

                        toast.info(i18n.t('notifications:rotary.enabled'), {
                            position: 'bottom-right',
                        });
                    },
                    onClose: () => {
                        store.replace('workspace.mode', WORKSPACE_MODE.DEFAULT);
                    },
                });
            } else if (firmwareType === GRBLHAL) {
                Confirm({
                    title: i18n.t('notifications:rotary.enable.title'),
                    cancelLabel: i18n.t('common:actions.cancel'),
                    confirmLabel: i18n.t('common:actions.ok'),
                    content: (
                        <div
                            style={{
                                textAlign: 'left',
                                width: '90%',
                                margin: 'auto',
                                fontSize: '1.25rem',
                            }}
                        >
                            <p>{i18n.t('notifications:rotary.enable.intro')}</p>

                            <ol>
                                <li style={{ marginBottom: '1rem' }}>
                                    {i18n.t(
                                        'notifications:rotary.enable.zeroY',
                                    )}
                                </li>
                                <li>
                                    <span>
                                        {i18n.t(
                                            'notifications:rotary.enable.swapAxisSettings',
                                        )}
                                    </span>

                                    <ul style={{ marginTop: '0.5rem' }}>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.travelResolution',
                                                {
                                                    y: '$101',
                                                    a: '$103',
                                                },
                                            )}
                                        </li>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.maximumRate',
                                                {
                                                    y: '$111',
                                                    a: '$113',
                                                },
                                            )}
                                        </li>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.acceleration',
                                                {
                                                    y: '$121',
                                                    a: '$123',
                                                },
                                            )}
                                        </li>
                                        <li>
                                            {i18n.t(
                                                'notifications:rotary.enable.travelAmount',
                                                {
                                                    y: '$131',
                                                    a: '$133',
                                                },
                                            )}
                                        </li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    ),
                    onConfirm: () => {
                        // switch A and Y axis settings, will look something like this: ["$101=26.667", ...]
                        const newAAxisSettings = [
                            `$103=${get(reduxStore.getState(), 'controller.settings.settings.$101')}`,
                            `$113=${get(reduxStore.getState(), 'controller.settings.settings.$111')}`,
                            `$123=${get(reduxStore.getState(), 'controller.settings.settings.$121')}`,
                            `$133=${get(reduxStore.getState(), 'controller.settings.settings.$131')}`,
                        ];
                        const newYAxisSettings = [
                            `$101=${get(reduxStore.getState(), 'controller.settings.settings.$103')}`,
                            `$111=${get(reduxStore.getState(), 'controller.settings.settings.$113')}`,
                            `$121=${get(reduxStore.getState(), 'controller.settings.settings.$123')}`,
                            `$131=${get(reduxStore.getState(), 'controller.settings.settings.$133')}`,
                        ];

                        // zero y and enable rotary
                        controller.command('gcode', [
                            'G10 L20 P1 Y0',
                            ...newAAxisSettings,
                            ...newYAxisSettings,
                            '$$',
                            ROTARY_TOGGLE_MACRO,
                        ]);

                        pubsub.publish('visualizer:updateposition', { y: 0 });

                        controller.command('updateRotaryMode', true);

                        toast.info(i18n.t('notifications:rotary.enabled'), {
                            position: 'bottom-right',
                        });
                    },
                    onClose: () => {
                        store.replace('workspace.mode', WORKSPACE_MODE.DEFAULT);
                        controller.command('updateRotaryMode', false);
                    },
                });
            }

            return;
        }

        default: {
            return;
        }
    }
};

export const checkIfRotaryFile = (gcode: string): boolean => {
    const commentMatcher = /\s*;.*/g;
    const bracketCommentLine = /\([^)]*\)/gm;
    const content = gcode
        .replace(bracketCommentLine, '')
        .trim()
        .replace(commentMatcher, '')
        .trim();
    return content.includes('A');
};
