import React from 'react';
import get from 'lodash/get';
import pubsub from 'pubsub-js';

import store from 'app/store';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import {
    WORKSPACE_MODE,
    ROTARY_MODE_FIRMWARE_SETTINGS,
    ROTARY_TOGGLE_MACRO,
    DEFAULT_FIRMWARE_SETTINGS,
    GRBL,
    GRBLHAL
} from 'app/constants';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

export const updateWorkspaceMode = (mode = WORKSPACE_MODE.DEFAULT) => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const reduxStoreState = reduxStore.getState();
    const firmwareType = get(reduxStoreState, 'controller.type');
    const rotaryFirmwareSettings = store.get('workspace.rotaryAxis.firmwareSettings', ROTARY_MODE_FIRMWARE_SETTINGS);

    store.replace('workspace.mode', mode);

    switch (mode) {
    case DEFAULT: {
        if (firmwareType === GRBL) {
            const defaultFirmwareSettings = store.get('workspace.rotaryAxis.defaultFirmwareSettings', DEFAULT_FIRMWARE_SETTINGS);

            const defaultFirmwareSettingsArr = Object.entries(defaultFirmwareSettings).map(([key, value]) => `${key}=${value}`);

            controller.command('gcode', [...defaultFirmwareSettingsArr, '$$', ROTARY_TOGGLE_MACRO]);
        } else if (firmwareType === GRBLHAL) {
            const previousHoming = Number(store.get('workspace.rotaryAxis.homingValue', 0));
            const homingString = (previousHoming !== 0) ? `$22=${previousHoming}` : '';
            // switch A and Y axis settings back
            const newAAxisSettings = [
                `$103=${get(reduxStoreState, 'controller.settings.settings.$101')}`,
                `$113=${get(reduxStoreState, 'controller.settings.settings.$111')}`,
                `$123=${get(reduxStoreState, 'controller.settings.settings.$121')}`,
                `$133=${get(reduxStoreState, 'controller.settings.settings.$131')}`
            ];
            const newYAxisSettings = [
                `$101=${get(reduxStoreState, 'controller.settings.settings.$103')}`,
                `$111=${get(reduxStoreState, 'controller.settings.settings.$113')}`,
                `$121=${get(reduxStoreState, 'controller.settings.settings.$123')}`,
                `$131=${get(reduxStoreState, 'controller.settings.settings.$133')}`
            ];

            // zero y and enable rotary
            controller.command('gcode', ['G10 L20 P1 Y0', ...newAAxisSettings, ...newYAxisSettings, ROTARY_TOGGLE_MACRO, 'G4 P0.4', homingString, '$$']);
        }
        return;
    }

    case ROTARY: {
        // We only need to update the firmware settings on grbl machines
        if (firmwareType === GRBL) {
            // Convert to array to send to the controller, will look something like this: ["$101=26.667", ...]
            const rotaryFirmwareSettingsArr = Object.entries(rotaryFirmwareSettings).map(([key, value]) => `${key}=${value}`);

            Confirm({
                title: 'Enable Rotary Mode',
                cancelLabel: 'Cancel',
                confirmLabel: 'OK',
                content: (
                    <div style={{ textAlign: 'left', width: '90%', margin: 'auto', fontSize: '1.25rem' }}>
                        <p>Enabling rotary mode will perform the following actions:</p>

                        <ol>
                            <li style={{ marginBottom: '1rem' }}>Zero the Y-Axis in it&apos;s current position</li>
                            <li style={{ marginBottom: '1rem' }}>Turn soft and hard limits off, if they are on</li>
                            <li>
                                <span>Update the following firmware values:</span>

                                <ul style={{ marginTop: '0.5rem' }}>
                                    <li>$101 (Y-Axis travel resolution)</li>
                                    <li>$111 (Y-Axis maximum rate)</li>
                                </ul>
                            </li>
                        </ol>

                        <p>Please make sure you have switched over your wiring for the new setup.</p>
                    </div>
                ),
                onConfirm: () => {
                    // zero y and enable rotary
                    controller.command('gcode', ['G10 L20 P1 Y0', ...rotaryFirmwareSettingsArr, '$$', ROTARY_TOGGLE_MACRO]);

                    pubsub.publish('visualizer:updateposition', { y: 0 });

                    Toaster.pop({
                        msg: 'Rotary Mode Enabled',
                        type: TOASTER_INFO,
                    });
                },
                onClose: () => {
                    store.replace('workspace.mode', WORKSPACE_MODE.DEFAULT);
                }
            });
        } else if (firmwareType === GRBLHAL) {
            Confirm({
                title: 'Enable Rotary Mode',
                cancelLabel: 'Cancel',
                confirmLabel: 'OK',
                content: (
                    <div style={{ textAlign: 'left', width: '90%', margin: 'auto', fontSize: '1.25rem' }}>
                        <p>Enabling rotary mode will perform the following actions:</p>

                        <ol>
                            <li style={{ marginBottom: '1rem' }}>Zero the Y-Axis in it&apos;s current position</li>
                            <li>
                                <span>Switch these A and Y axis settings:</span>

                                <ul style={{ marginTop: '0.5rem' }}>
                                    <li>$101 and $103 (travel resolution)</li>
                                    <li>$111 and $113 (maximum rate)</li>
                                    <li>$121 and $123 (acceleration)</li>
                                    <li>$131 and $133 (travel amount)</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                ),
                onConfirm: () => {
                    const reduxStoreState = reduxStore.getState();
                    const homingValue = Number(get(reduxStoreState, 'controller.settings.settings.$22', -1));
                    const homingString = (homingValue > 0) ? '$22=0' : '';
                    store.set('workspace.rotaryAxis.homingValue', homingValue);
                    // switch A and Y axis settings, will look something like this: ["$101=26.667", ...]
                    const newAAxisSettings = [
                        `$103=${get(reduxStoreState, 'controller.settings.settings.$101')}`,
                        `$113=${get(reduxStoreState, 'controller.settings.settings.$111')}`,
                        `$123=${get(reduxStoreState, 'controller.settings.settings.$121')}`,
                        `$133=${get(reduxStoreState, 'controller.settings.settings.$131')}`
                    ];
                    const newYAxisSettings = [
                        `$101=${get(reduxStoreState, 'controller.settings.settings.$103')}`,
                        `$111=${get(reduxStoreState, 'controller.settings.settings.$113')}`,
                        `$121=${get(reduxStoreState, 'controller.settings.settings.$123')}`,
                        `$131=${get(reduxStoreState, 'controller.settings.settings.$133')}`
                    ];

                    // zero y and enable rotary
                    controller.command('gcode', [homingString, 'G10 L20 P1 Y0', ...newAAxisSettings, ...newYAxisSettings, '$$', ROTARY_TOGGLE_MACRO]);

                    pubsub.publish('visualizer:updateposition', { y: 0 });

                    Toaster.pop({
                        msg: 'Rotary Mode Enabled',
                        type: TOASTER_INFO,
                    });
                },
                onClose: () => {
                    store.replace('workspace.mode', WORKSPACE_MODE.DEFAULT);
                }
            });
        }

        return;
    }

    default: {
        return;
    }
    }
};

export const checkIfRotaryFile = (gcode) => {
    const commentMatcher = /\s*;.*/g;
    const bracketCommentLine = /\([^\)]*\)/gm;
    const content = gcode.replace(bracketCommentLine, '').trim().replace(commentMatcher, '').trim();
    return content.includes('A');
};
