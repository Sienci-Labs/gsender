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

import defaultGrbl from '../../../../app/containers/Firmware/eepromFiles/DefaultGrblSettings.json';
import longMill12x12 from '../../../../app/containers/Firmware/eepromFiles/Sienci Long Mill12X12.json';
import longMill12x30 from '../../../../app/containers/Firmware/eepromFiles/Sienci Long Mill12X30.json';
import longMill30x30 from '../../../../app/containers/Firmware/eepromFiles/Sienci Long Mill30X30.json';
import millOne from '../../../../app/containers/Firmware/eepromFiles/Sienci Mill One.json';
import millOneV3 from '../../../../app/containers/Firmware/eepromFiles/Sienci Mill OneV3.json';
import mK230x30 from '../../../../app/containers/Firmware/eepromFiles/MK2_30x30.json';
import mK212x30 from '../../../../app/containers/Firmware/eepromFiles/MK2_12x30.json';

import store from '../../../store';

const ApplyFirmwareProfile = (nameOfMachine, typeOfMachine, recievedPortNumber) => {
    const controller = store.get(`controllers[${recievedPortNumber}]`);
    let settings = defaultGrbl;

    if (nameOfMachine === 'Mill One') {
        if (typeOfMachine === 'V3') {
            settings = millOneV3;
        } else {
            settings = millOne;
        }
    }

    if (nameOfMachine === 'LongMill') {
        if (typeOfMachine === '12x12') {
            settings = longMill12x12;
        }
        if (typeOfMachine === '12x30') {
            settings = longMill12x30;
        }
        if (typeOfMachine === '30x30') {
            settings = longMill30x30;
        }
    }

    if (nameOfMachine === 'LongMill MK2') {
        if (typeOfMachine === '12X30') {
            settings = mK212x30;
        }
        if (typeOfMachine === '30x30') {
            settings = mK230x30;
        }
    }

    const values = Object.entries(settings).map(([key, value]) => (`${key}=${value}`));
    values.push('$$');

    controller.command('gcode', values);
};

export default ApplyFirmwareProfile;
