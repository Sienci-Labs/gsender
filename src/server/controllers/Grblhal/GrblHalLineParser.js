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

import _ from 'lodash';
import GrblHalLineParserResultStatus from './GrblHalLineParserResultStatus';
import GrblHalLineParserResultOk from './GrblHalLineParserResultOk';
import GrblHalLineParserResultError from './GrblHalLineParserResultError';
import GrblHalLineParserResultAlarm from './GrblHalLineParserResultAlarm';
import GrbHalLineParserResultParserState from './GrblHalLineParserResultParserState';
import GrblHalLineParserResultParameters from './GrblHalLineParserResultParameters';
import GrblHalLineParserResultHelp from './GrblHalLineParserResultHelp';
import GrblHalLineParserResultVersion from './GrblHalLineParserResultVersion';
import GrblHalLineParserResultEcho from './GrblHalLineParserResultEcho';
import GrblHalLineParserResultFeedback from './GrblHalLineParserResultFeedback';
import GrblHalLineParserResultSettings from './GrblHalLineParserResultSettings';
import GrblHalLineParserResultStartup from './GrblHalLineParserResultStartup';
import GrblHalLineParserResultCode from './GrblHalLineParserResultCode';
import GrblHalLineParserResultInfo from './GrblHalLineParserResultInfo';

// Grbl v1.1
// https://github.com/gnea/grbl/blob/edge/doc/markdown/interface.md

class GrblHalLineParser {
    parse(line) {
        const parsers = [
            // <Alarm:#|[...]>
            GrblHalLineParserResultCode,

            // <>
            GrblHalLineParserResultStatus,

            // ok
            GrblHalLineParserResultOk,

            // error:x
            GrblHalLineParserResultError,

            // ALARM:
            GrblHalLineParserResultAlarm,

            // [G38.2 G54 G17 G21 G91 G94 M0 M5 M9 T0 F20. S0.] (v0.9)
            // [GC:G38.2 G54 G17 G21 G91 G94 M0 M5 M9 T0 F20. S0.] (v1.1)
            GrbHalLineParserResultParserState,

            // [G54:0.000,0.000,0.000]
            // [G55:0.000,0.000,0.000]
            // [G56:0.000,0.000,0.000]
            // [G57:0.000,0.000,0.000]
            // [G58:0.000,0.000,0.000]
            // [G59:0.000,0.000,0.000]
            // [G28:0.000,0.000,0.000]
            // [G30:0.000,0.000,0.000]
            // [G92:0.000,0.000,0.000]
            // [TLO:0.000]
            // [PRB:0.000,0.000,0.000:0]
            GrblHalLineParserResultParameters,

            // [HLP:] (v1.1)
            GrblHalLineParserResultHelp,

            // [VER:] (v1.1)
            GrblHalLineParserResultVersion,

            // [XXXX:] (v1.1)
            GrblHalLineParserResultInfo,

            // [echo:] (v1.1)
            GrblHalLineParserResultEcho,

            // [] (v0.9)
            // [MSG:] (v1.1)
            GrblHalLineParserResultFeedback,

            // $xx
            GrblHalLineParserResultSettings,

            // Grbl X.Xx ['$' for help]
            GrblHalLineParserResultStartup
        ];

        for (let parser of parsers) {
            const result = parser.parse(line);
            if (result) {
                _.set(result, 'payload.raw', line);
                return result;
            }
        }

        return {
            type: null,
            payload: {
                raw: line
            }
        };
    }
}

export default GrblHalLineParser;