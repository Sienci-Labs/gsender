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

class GrblHalLineParserResultTool {
    static parse(line) {
        //   [T:1|0.000,0.000,0.000,0.000|0.000]
        //
        //const r = line.match(/\[T:(\d+)\|([-\d.]+(?:,[-\d.]+){2,6})\|([-\d.]+)]/);

        const r = line.match(/\[T:(\d+)\|([-\d.]+(?:,[-\d.]+){2,6})\|([-\d.]+)(.+)?]/);

        if (!r) {
            return null;
        }

        console.log(r);

        const axes = ['x', 'y', 'z', 'a', 'b', 'c'];

        const offsetMap = r[2].split(',')
            .reduce((acc, cur, i) => {
                acc[axes[i]] = Number(Number(cur).toFixed(3));
                return acc;
            }, {});

        const payload = {
            id: Number(r[1]),
            toolOffsets: offsetMap,
            toolRadius: Number(r[3])
        };

        return {
            type: GrblHalLineParserResultTool,
            payload: payload
        };
    }
}

export default GrblHalLineParserResultTool;
