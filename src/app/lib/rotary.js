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

        controller.command('gcode', prevFirmwareSettingsArr);
        return;
    }

    case ROTARY: {
        const currentFirmwareSettings = controller.settings.settings;

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
            controller.command('gcode', rotaryFirmwareSettingsArr);

            Confirm({
                title: 'Wiring Changeover',
                cancelLabel: null,
                confirmLabel: 'OK',
                content: 'Rotary mode enabled. Please make sure you have switch over your wiring for the new setup.'
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
