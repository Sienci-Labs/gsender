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

import _trim from 'lodash/trim';

const pattern = new RegExp(/^([a-zA-Z0-9]+)\s+((?:\d+\.){1,2}\d+[a-zA-Z0-9\-\.]*)([^\[]*\[[^\]]+\].*)?/);

class GrblLineParserResultStartup {
    // Grbl 0.9j ['$' for help]
    // Grbl 1.1d ['$' for help]
    // Grbl 1.1
    // Grbl 1.1h: LongMill build ['$' for help]
    // Grbl 1.1h ['$' for help] LongMill build Feb 25, 2020
    // gCarvin 2.0.0 ['$' for help]
    static parse(line) {
        const r = line.match(pattern);
        if (!r) {
            return null;
        }

        const firmware = r[1];
        const version = r[2];
        const message = _trim(r[3]);

        const payload = {
            firmware,
            version,
            message,
        };

        return {
            type: GrblLineParserResultStartup,
            payload: payload
        };
    }
}

export default GrblLineParserResultStartup;
