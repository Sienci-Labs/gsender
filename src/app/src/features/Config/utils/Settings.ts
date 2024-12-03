import download from 'downloadjs';
import store from 'app/store';
import api from 'app/api';
import { restoreDefault, storeUpdate } from 'app/lib/storeUpdate';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';

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
    const events = res.body.records;

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
