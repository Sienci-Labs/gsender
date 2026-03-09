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

import ensureArray from 'ensure-array';
import _compact from 'lodash/compact';
import _find from 'lodash/find';
import _get from 'lodash/get';
import _includes from 'lodash/includes';
import _set from 'lodash/set';
import _trim from 'lodash/trim';
import {
    GRBL_HAL_MODAL_GROUPS
} from './constants';

class GrbHalLineParserResultParserState {
    // * Grbl v1.1
    //   [GC:G0 G54 G17 G21 G90 G94 M0 M5 M9 T0 S0.0 F500.0]
    // * grblHAL
    //   [GC:G0 G54 G17 G21 G90 G94 G49 G98 G50 M0 M5 M9 T0 S0.0 F500.0]
    //   new: G49, G50, G98
    //   don't care about G50
    static parse(line) {
        const r = line.match(/^\[(?:GC:)?((?:[a-zA-Z][0-9]+(?:\.[0-9]*)?\s*)+)\]$/);
        if (!r) {
            return null;
        }
        const payload = {};
        const words = _compact(r[1].split(' '))
            .map((word) => {
                return _trim(word);
            });

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];

            // Handle malformed words for G parser (Genmitsu...)
            if (word.length === 0) {
                continue;
            }

            // Gx, Mx
            if (word.indexOf('G') === 0 || word.indexOf('M') === 0) {
                const r = _find(GRBL_HAL_MODAL_GROUPS, (group) => {
                    return _includes(group.modes, word);
                });

                if (!r) {
                    continue;
                }

                const prevWord = _get(payload, 'modal.' + r.group, '');
                if (prevWord) {
                    _set(payload, 'modal.' + r.group, ensureArray(prevWord).concat(word));
                } else {
                    _set(payload, 'modal.' + r.group, word);
                }

                continue;
            }

            // T: tool number
            if (word.indexOf('T') === 0) {
                _set(payload, 'tool', word.substring(1));
                continue;
            }

            // F: feed rate
            if (word.indexOf('F') === 0) {
                _set(payload, 'feedrate', word.substring(1));
                continue;
            }

            // S: spindle speed
            if (word.indexOf('S') === 0) {
                _set(payload, 'spindle', word.substring(1));
                continue;
            }
        }

        return {
            type: GrbHalLineParserResultParserState,
            payload: payload
        };
    }
}

export default GrbHalLineParserResultParserState;
