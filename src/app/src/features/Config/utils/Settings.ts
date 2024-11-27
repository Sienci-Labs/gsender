import download from 'downloadjs';

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
