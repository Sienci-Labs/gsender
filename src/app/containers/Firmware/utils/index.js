import { createContext } from 'react';
import get from 'lodash/get';
import download from 'downloadjs';

import controller from 'app/lib/controller';
import WidgetConfig from 'app/widgets/WidgetConfig';
import { Toaster, TOASTER_SUCCESS, TOASTER_INFO, TOASTER_DANGER } from 'app/lib/toaster/ToasterLib';
// import store from 'app/store';
import { GRBL } from 'app/constants';

import defaultGRBLSettings from '../eepromFiles/DefaultGrblSettings.json';

export const FirmwareContext = createContext({ });

export const controllerSettingsLoaded = () => {
    const { settings } = controller.settings;
    if (settings) {
        return (Object.keys(settings).length > 0);
    }
    return false;
};


export const connectToLastDevice = () => {
    const connectionConfig = new WidgetConfig('connection');

    const port = connectionConfig.get('port');
    const baudrate = connectionConfig.get('baudrate');
    controller.openPort(port, {
        controllerType: GRBL,
        baudrate,
        rtscts: false
    }, (err) => {
        if (err) {
            return;
        }
    });
};

export const getResetToDefaultMessage = ({ name, type } = {}) => {
    const supportedMachines = ['Mill One', 'LongMill', 'LongMill MK2'];
    const message = supportedMachines.includes(name)
        ? `Are you sure you want to restore your ${name} ${type} back to its default state?`
        : `We dont have the default settings for your ${name} ${type}. Would you like to Restore your machine to the Grbl defaults?`;

    return message;
};

export const getMachineProfileVersion = (profile) => {
    //const machineProfile = store.get('workspace.machineProfile');
    // return get(machineProfile, 'version', 'MK1');
    return get(profile, 'version', 'MK1');
};

export const startFlash = (port, profile) => {
    if (!port) {
        Toaster.pop({
            msg: 'No port specified - please connect to the device to determine what is being flashed',
            type: TOASTER_DANGER,
            duration: 15000
        });
        return;
    }
    Toaster.pop({
        msg: `Flashing started on port: ${port} `,
        type: TOASTER_INFO,
        duration: 10000
    });
    const imageType = getMachineProfileVersion(profile);
    controller.flashFirmware(port, imageType);
};

export const restoreDefaultSettings = (machineProfile) => {
    const eepromSettings = machineProfile?.eepromSettings ?? defaultGRBLSettings;
    const values = Object.entries(eepromSettings).map(([key, value]) => (`${key}=${value}`));
    values.push('$$');

    controller.command('gcode', values);

    Toaster.pop({
        msg: ('Default Settings Restored'),
        type: TOASTER_INFO,
    });
};

export const addControllerEvents = (controllerEvents) => {
    Object.keys(controllerEvents).forEach(eventName => {
        const callback = controllerEvents[eventName];
        controller.addListener(eventName, callback);
    });
};

export const removeControllerEvents = (controllerEvents) => {
    Object.keys(controllerEvents).forEach(eventName => {
        const callback = controllerEvents[eventName];
        controller.removeListener(eventName, callback);
    });
};

export const convertValueToArray = (value, possibilities) => {
    let index = Number(value);

    if (index > possibilities.length - 1) {
        index = possibilities.length - 1;
    }

    return possibilities[index];
};

export const applyNewSettings = (settings, eeprom, setSettingsToApply) => {
    let index22 = 200; // index of $22 - default is 200 because we have less eeprom values than that, so it will never be set to this value
    let index2021 = -1; // index of $20 or $21, whichever comes first
    let changedSettings = settings
        .filter(item => eeprom[item.setting] !== item.value) // Only retrieve settings that have been modified
        .map((item, i) => { // Create array of set eeprom value strings (ex. "$0=1")
            if (item.setting === '$22') { // always find where $22 is
                index22 = i;
            } else if ((item.setting === '$20' || item.setting === '$21') && i < index22 && index2021 === -1) {
                // if $20 or $21 come before $22,
                // and this is the first occurence of $20 or $21,
                // we are going to have to switch it with $20, so save the index.
                index2021 = i;
            }
            return `${item.setting}=${item.value}`;
        });

    // switch commands so $20 comes first
    // check that the indexes have been set for both and that they are both being enabled, otherwise there's no need to switch
    if (index2021 >= 0 && index22 < 200 && changedSettings[index22].includes('=1') && changedSettings[index2021].includes('=1')) {
        const setting22 = changedSettings[index22];
        changedSettings[index22] = changedSettings[index2021];
        changedSettings[index2021] = setting22;
    }

    controller.command('gcode', changedSettings);
    controller.command('gcode', '$$'); //Needed so next time wizard is opened changes are reflected
    setSettingsToApply(false);
    Toaster.pop({
        msg: 'Firmware Settings Updated',
        type: TOASTER_SUCCESS
    });
};

export const importFirmwareSettings = (file, callback) => {
    const reader = new FileReader();

    reader.onload = callback;
    reader.readAsText(file);
};

export const exportFirmwareSettings = (settings) => {
    const output = JSON.stringify(settings, null, 1);

    const blob = new Blob([output], { type: 'application/json' });

    const today = new Date();
    const filename = `gSender-firmware-settings-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;

    download(blob, filename, 'json');
};
