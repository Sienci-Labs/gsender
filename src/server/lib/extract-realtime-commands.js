/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

// Matches literal [\xNN] tokens in macro/gcode text (1–2 hex digits).
// The backslash here is a printable character in the stored string, not an escape.
const RE = /\[\\x([0-9a-fA-F]{1,2})\]/g;

/**
 * Strips [\xNN] realtime-command tokens from a gcode line before expression
 * translation. Returns the cleaned line and each decoded byte as a string so
 * the caller can writeImmediate() them directly to the serial port.
 *
 * Examples:
 *   "[\x84]"         → { line: '',       realtimeCmds: ['\x84'] }
 *   "G0 X10 [\x18]"  → { line: 'G0 X10', realtimeCmds: ['\x18'] }
 *   "[\x84][\x85]"   → { line: '',       realtimeCmds: ['\x84', '\x85'] }
 *
 * @param {string} line  Raw gcode line (before expression translation)
 * @returns {{ line: string, realtimeCmds: string[] }}
 */
export function extractRealtimeCommands(line) {
    const realtimeCmds = [];
    const cleaned = line.replace(RE, (_, hex) => {
        realtimeCmds.push(String.fromCharCode(parseInt(hex, 16)));
        return '';
    }).trim();
    return { line: cleaned, realtimeCmds };
}
