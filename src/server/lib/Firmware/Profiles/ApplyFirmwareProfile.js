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

import defaultGrbl from '!raw-loader!./EepromFiles/DefaultGrblSettings.txt';
import LongMill12x12 from '!raw-loader!./EepromFiles/Sienci Long Mill12X12.txt';
import LongMill12x30 from '!raw-loader!./EepromFiles/Sienci Long Mill12X30.txt';
import LongMill30x30 from '!raw-loader!./EepromFiles/Sienci Long Mill30X30.txt';
import MillOne from '!raw-loader!./EepromFiles/Sienci Mill One.txt';
import MillOneV3 from '!raw-loader!./EepromFiles/Sienci Mill OneV3.txt';
import map from 'lodash/map';
import store from '../../../store';

const ApplyFirmwareProfile = (nameOfMachine, typeOfMachine, recievedPortNumber) => {
    const gcode = (cmd, params) => {
        const s = map(params, (value, letter) => String(letter + value)).join('=');
        return (s.length > 0) ? (cmd + '' + s) : cmd;
    };

    const controller = store.get('controllers["' + recievedPortNumber + '"]');

    let settings = defaultGrbl;

    if (nameOfMachine === 'Mill One') {
        if (typeOfMachine === 'V3') {
            settings = MillOneV3;
        } else {
            settings = MillOne;
        }
    }

    if (nameOfMachine === 'LongMill') {
        if (typeOfMachine === '12x12') {
            settings = LongMill12x12;
        }
        if (typeOfMachine === '12x30') {
            settings = LongMill12x30;
        }
        if (typeOfMachine === '30x30') {
            settings = LongMill30x30;
        }
    }

    const obj = JSON.parse(settings);
    let values = Object.values(obj);
    if (values.length === 34) {
        for (let i = 0; i < values.length; i++) {
            if (values[i] === true) {
                values[i] = '1';
            } if (values[i] === false) {
                values[i] = '0';
            }
        }

        let keys = Object.keys(obj);
        let finalStrings = [];
        const valuesToSubmit = [];
        for (let i = 0; i < keys.length; i++) {
            valuesToSubmit.push([keys[i], values[i]]);
        }
        let gCoded = gcode(valuesToSubmit);

        for (let j = 0; j < gCoded.length; j++) {
            finalStrings[j] = gCoded[j].join('=');
        }
        controller.command('gcode', finalStrings);
        controller.command('gcode', '$$');
    }
};

export default ApplyFirmwareProfile;
