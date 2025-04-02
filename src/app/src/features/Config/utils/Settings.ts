import download from 'downloadjs';
import store from 'app/store';
import api from 'app/api';
import { restoreDefault, storeUpdate } from 'app/lib/storeUpdate';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { generateEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import { toast } from 'sonner';
import controller from 'app/lib/controller.ts';
import pubsub from 'pubsub-js';

export function exportFirmwareSettings(settings) {
    const output = JSON.stringify(settings);
    const blob = new Blob([output], { type: 'application/json' });

    const today = new Date();
    const filename = `gSender-firmware-settings-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;

    download(blob, filename, 'json');
}

export function humanReadableMachineName(o) {
    let name = o.name;
    if (o.type?.length > 0) {
        name += ` ${o.type}`;
    }
    if (o.version?.length > 0) {
        name += ` (${o.version})`;
    }
    return name;
}

export async function exportSettings() {
    const settings = store.get();
    settings.commandKeys = Object.fromEntries(
        Object.entries(settings.commandKeys).filter(
            ([key, shortcut]) => shortcut.category !== 'Macros',
        ),
    ); //Exclude macro shortcuts
    delete settings.session;

    const res = await api.events.fetch();
    const events = res.data.records;

    const settingsJSON = JSON.stringify({ settings, events }, null, 3);
    const data = new Blob([settingsJSON], {
        type: 'application/json',
    });

    const today = new Date();
    const filename = `gSender-settings-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;

    // IE11 & Edge
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(data, filename);
    } else {
        // In FF link must be added to DOM to be clicked
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(data);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

const onImportConfirm = (file) => {
    if (file) {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = async (event) => {
            await storeUpdate(event.target.result);
        };
        reader.onerror = () => {
            console.error('Unable to load settings to import');
        };
    }
};

export function importSettings(e) {
    const file = e.target.files[0];

    Confirm({
        title: 'Import Settings',
        content:
            'All your current settings will be replaced. Are you sure you want to import your settings on gSender?',
        confirmLabel: 'Import Settings',
        onConfirm: () => onImportConfirm(file),
    });
}

export function handleRestoreDefaultClick() {
    Confirm({
        title: 'Restore Settings',
        content:
            'All your current settings will be removed. Are you sure you want to restore default settings on gSender?',
        confirmLabel: 'Restore Settings',
        onConfirm: restoreDefault,
    });
}

export function matchesSearchTerm(o, term = '') {
    // For empty search, we always match
    if (term.length === 0 || !term) {
        return true;
    }
    return JSON.stringify(o).toLowerCase().includes(term.toLowerCase());
}

export function generateSenderSettings(settings) {
    const dirtySettings = {};
    settings.map((s) => {
        if (s.dirty) {
            dirtySettings[s.key] = s.value;
            s.dirty = false;
        }
    });
    return dirtySettings;
}

export function updateAllSettings(settings, eeprom) {
    const eepromToChange = generateEEPROMSettings(eeprom);
    const eepromNumber = Object.keys(eepromToChange).length;
    if (eepromNumber > 0) {
        let changedSettings = Object.keys(eepromToChange).map(
            (k) => `${k}=${eepromToChange[k]}`,
        );
        changedSettings.push('$$');
        controller.command('gcode', changedSettings);
        toast.success(`Updated ${eepromNumber} EEPROM values.`);
    }

    const settingsToUpdate = generateSenderSettings(settings);
    const updateableSettingsNumber = Object.keys(settingsToUpdate).length;
    if (updateableSettingsNumber > 0) {
        Object.keys(settingsToUpdate).map((k) => {
            store.set(k, settingsToUpdate[k]);
        });
        toast.success(`Updated ${updateableSettingsNumber} settings.`);
    }

    pubsub.publish('config:saved');
}
