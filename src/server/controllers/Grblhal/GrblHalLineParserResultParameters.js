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

class GrblHalLineParserResultParameters {
    static parse(line) {
        const r = line.match(/^\[(G54|G55|G56|G57|G58|G59|G59.1|G59.2|G59.3|G28|G30|G92|TLO|PRB):(.+)\]$/);
        if (!r) {
            return null;
        }

        const name = r[1];
        const value = r[2];
        const payload = {
            name: name,
            value: ''
        };
        console.log(r);
        // [Gxx:0.000]
        //const re = /^G\d+$/i;
        const re = /^G\d+(?:\.\d+)?$/i;
        if (re.test(name)) {
            const axes = ['x', 'y', 'z', 'a', 'b', 'c'];
            const list = value.split(',');
            payload.value = {};
            for (let i = 0; i < list.length; ++i) {
                payload.value[axes[i]] = list[i];
            }
        }

        // [TLO:0.000]
        if (name === 'TLO') {
            payload.value = value;
        }

        // [PRB:0.000,0.000,1.492:1]
        if (name === 'PRB') {
            const axes = ['x', 'y', 'z', 'a', 'b', 'c'];
            const [str, result] = value.split(':');
            const list = str.split(',');
            payload.value = {};
            payload.value.result = Number(result);
            for (let i = 0; i < list.length; ++i) {
                payload.value[axes[i]] = list[i];
            }
        }

        return {
            type: GrblHalLineParserResultParameters,
            payload: payload
        };
    }
}

export default GrblHalLineParserResultParameters;
