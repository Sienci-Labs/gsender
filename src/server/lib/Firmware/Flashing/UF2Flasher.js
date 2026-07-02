import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import events from 'events';
import logger from '../../logger';

const log = logger('UF2Flasher');

// Volume labels an RP2350/RP2040 board presents when in BOOTSEL/UF2 mode.
// RP2350 (Pico 2) mounts as "RP2350"; classic RP2040 mounts as "RPI-RP2".
const ACCEPTED_LABELS = ['RP2350', 'RPI-RP2'];

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 20000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flashes an RP2350 (Pico 2350) board by copying a .uf2 image onto the
 * mass-storage volume the board exposes once it enters UF2/BOOTSEL mode.
 *
 * Emits the same events as DFUFlasher so it can reuse the existing flash
 * status plumbing in CNCEngine: 'info', 'progress', 'error', 'end'.
 */
class UF2Flasher extends events.EventEmitter {
    constructor({ uf2 }) {
        super();
        // Data arrives over socket.io as a Buffer/ArrayBuffer of raw bytes.
        this.data = Buffer.isBuffer(uf2) ? uf2 : Buffer.from(uf2);
    }

    async flash() {
        this.emit('info', 'Waiting for Pico bootloader volume…');

        let volumePath;
        try {
            volumePath = await this.pollForVolume();
        } catch (err) {
            this.emit('error', err.message || String(err));
            return;
        }

        this.emit('info', `Found bootloader volume at ${volumePath}`);

        const total = this.data.length;
        const target = path.join(volumePath, 'firmware.uf2');
        this.emit('info', `Copying UF2 image (${total} bytes) to ${target}`);
        this.emit('progress', 0, total);

        // fs.writeFileSync blocks the event loop, so yield first to let the
        // "Copying" message flush over the socket before the write begins.
        await delay(0);

        try {
            fs.writeFileSync(target, this.data);
        } catch (err) {
            // The board frequently reboots and unmounts the volume the instant
            // the image is fully written, so a write error tail is normal and
            // should be treated as success rather than a failure.
            if (err.code === 'ENOENT' || err.code === 'ENODEV' || err.code === 'EIO') {
                log.info(`Volume disappeared during write (${err.code}) — treating as reboot`);
            } else {
                this.emit('error', `Failed to write UF2 to ${target}: ${err.message || err}`);
                return;
            }
        }

        this.emit('progress', total, total);
        this.emit('info', 'Flash complete — board rebooting');
        this.emit('end');
    }

    async pollForVolume() {
        const deadline = Date.now() + POLL_TIMEOUT_MS;
        while (Date.now() < deadline) {
            const found = this.findBootloaderVolume();
            if (found) {
                return found;
            }
            await delay(POLL_INTERVAL_MS);
        }
        throw new Error(
            'Could not find RP2350 bootloader volume — is the board in UF2 mode?'
        );
    }

    // Returns the mount path of the bootloader volume, or null if not present.
    findBootloaderVolume() {
        try {
            switch (process.platform) {
            case 'darwin':
                return this.findVolumeMac();
            case 'win32':
                return this.findVolumeWindows();
            default:
                return this.findVolumeLinux();
            }
        } catch (err) {
            log.error(`Error while searching for bootloader volume: ${err.message || err}`);
            return null;
        }
    }

    findVolumeMac() {
        for (const label of ACCEPTED_LABELS) {
            const candidate = path.join('/Volumes', label);
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    findVolumeLinux() {
        const user = os.userInfo().username;
        const bases = ['/media', `/media/${user}`, `/run/media/${user}`];
        for (const base of bases) {
            for (const label of ACCEPTED_LABELS) {
                const candidate = path.join(base, label);
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            }
        }

        // Fall back to parsing /proc/mounts for a mountpoint whose basename
        // matches an accepted label (covers custom automount locations).
        try {
            const mounts = fs.readFileSync('/proc/mounts', 'utf-8').split('\n');
            for (const line of mounts) {
                const mountPoint = line.split(' ')[1];
                if (!mountPoint) {
                    continue;
                }
                // /proc/mounts octal-escapes spaces etc. as \040
                const decoded = mountPoint.replace(/\\(\d{3})/g, (_, oct) =>
                    String.fromCharCode(parseInt(oct, 8))
                );
                if (ACCEPTED_LABELS.includes(path.basename(decoded))) {
                    return decoded;
                }
            }
        } catch (err) {
            log.error(`Unable to read /proc/mounts: ${err.message || err}`);
        }
        return null;
    }

    findVolumeWindows() {
        // Prefer PowerShell Get-Volume; fall back to wmic for older systems.
        for (const label of ACCEPTED_LABELS) {
            const letter = this.getWindowsDriveLetter(label);
            if (letter) {
                return `${letter}:\\`;
            }
        }
        return null;
    }

    getWindowsDriveLetter(label) {
        try {
            const out = execFileSync(
                'powershell.exe',
                [
                    '-NoProfile',
                    '-Command',
                    `(Get-Volume | Where-Object { $_.FileSystemLabel -eq '${label}' } | Select-Object -First 1 -ExpandProperty DriveLetter)`,
                ],
                { encoding: 'utf-8', timeout: 4000 }
            ).trim();
            if (out) {
                return out;
            }
        } catch (err) {
            log.error(`Get-Volume lookup failed for ${label}: ${err.message || err}`);
        }

        // wmic fallback: "VolumeName  Name" rows.
        try {
            const out = execFileSync(
                'cmd.exe',
                ['/c', 'wmic', 'logicaldisk', 'get', 'name,volumename'],
                { encoding: 'utf-8', timeout: 4000 }
            );
            for (const line of out.split('\n')) {
                if (line.toUpperCase().includes(label.toUpperCase())) {
                    const match = line.match(/([A-Za-z]):/);
                    if (match) {
                        return match[1];
                    }
                }
            }
        } catch (err) {
            log.error(`wmic fallback failed for ${label}: ${err.message || err}`);
        }
        return null;
    }
}

export default UF2Flasher;
