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

import isEqual from 'lodash/isEqual';

class GrblHalLineParserResultInfo {
    static parse(line) {
        const r = line.match(/^\[([A-Z ]*):(.+)\]$/);
        if (!r) {
            return null;
        }

        if (isEqual(r[1], 'NEWOPT')) {
            let values = {};
            let opts = r[2].split(',');
            opts.forEach(opt => {
                let [key, value] = opt.split('=');
                values[key] = value || null;
            });
            r[2] = values;
        }

        const payload = {
            name: r[1],
            value: r[2],
            raw: r[0]
        };

        return {
            type: GrblHalLineParserResultInfo,
            payload: payload
        };
    }
}

export default GrblHalLineParserResultInfo;
