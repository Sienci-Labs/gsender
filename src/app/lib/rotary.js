import React from 'react';
import get from 'lodash/get';

import store from 'app/store';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import {
    WORKSPACE_MODE,
    ROTARY_MODE_FIRMWARE_SETTINGS
} from 'app/constants';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

export const updateWorkspaceMode = (mode = WORKSPACE_MODE.DEFAULT) => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const firmwareType = get(reduxStore.getState(), 'controller.type');

    store.replace('workspace.mode', mode);

    switch (mode) {
    case DEFAULT: {
        const prevFirmwareSettings = store.get('workspace.rotaryAxis.prevFirmwareSettings', {});
        const prevFirmwareSettingsArr = Object.entries(prevFirmwareSettings).map(([key, value]) => `${key}=${value}`);

        store.replace('workspace.rotaryAxis.prevFirmwareSettings', {});

        controller.command('gcode', [...prevFirmwareSettingsArr, '$$']);
        return;
    }

    case ROTARY: {
        const currentFirmwareSettings = get(reduxStore.getState(), 'controller.settings.settings');

        // Only grab the settings we want, will be based off of the settings in the constant we have
        const retrievedSettings = Object.keys(ROTARY_MODE_FIRMWARE_SETTINGS).reduce((accumulator, currentKey) => {
            const firmwareSettingValue = currentFirmwareSettings[currentKey];

            if (firmwareSettingValue) {
                accumulator[currentKey] = firmwareSettingValue;
            }

            return accumulator;
        }, {});

        // We only need to update the firmware settings on grbl machines
        if (firmwareType === 'Grbl') {
            // Convert to array to send to the controller, will look something like this: ["$101=26.667", ...]
            const rotaryFirmwareSettingsArr = Object.entries(ROTARY_MODE_FIRMWARE_SETTINGS).map(([key, value]) => `${key}=${value}`);

            Confirm({
                title: 'Enable Rotary Mode',
                cancelLabel: 'Cancel',
                confirmLabel: 'OK',
                content:
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'left',
                            alignItems: 'flex-start',
                            marginLeft: '30px',
                        }}
                    >
                        <p>Enabling Rotary Mode will do the following:</p>
                        <p style={{ marginLeft: '10px' }}>1. Zero the Y-Axis in it&apos;s current position</p>
                        <p style={{ marginLeft: '10px' }}>2. Turn Hard Limits off, if they are on</p>
                        <p style={{ marginLeft: '10px' }}>3. Set the Y-Axis Travel Resolution to 19.75308642</p>
                        <p>Please make sure you have switched over your wiring for the new setup.</p>
                    </div>,
                onConfirm: () => {
                    // zero y and enable rotary
                    controller.command('gcode', ['G10 L20 P1 Y0', ...rotaryFirmwareSettingsArr, '$$']);
                },
            });
        }

        store.replace('workspace.rotaryAxis.prevFirmwareSettings', retrievedSettings);
        return;
    }

    default: {
        return;
    }
    }
};
