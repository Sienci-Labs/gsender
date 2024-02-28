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

import millOneFile from '../eepromFiles/Sienci Mill One.json';
import millOneV3File from '../eepromFiles/Sienci Mill OneV3.json';
import longMill12x12File from '../eepromFiles/Sienci Long Mill12X12.json';
import longMill12x30File from '../eepromFiles/Sienci Long Mill12X30.json';
import longMill30x30File from '../eepromFiles/Sienci Long Mill30X30.json';
import MK2LongMill12x30File from '../eepromFiles/MK2_12x30.json';
import MK2LongMill30x30File from '../eepromFiles/MK2_30x30.json';
import MK2LongMill48x30File from '../eepromFiles/MK2_48x30.json';
import MK1LongMill48x30File from '../eepromFiles/MK1_48x30.json';
//import DefaultGrblHalSettings from '../eepromFiles/DefaultGrblHalSettings.json';
import DefaultSLBSettings from '../eepromFiles/DefaultSLBSettings.json';

export default [
    // this is a fake test machine for grblHal, for testing purposes
    {
        'id': 0,
        'company': 'Sienci Labs',
        'name': 'LongMill MK2',
        'type': '30x30',
        'version': 'MK2',
        'mm': {
            'width': 792,
            'depth': 845,
            'height': 114.3
        },
        'in': {
            'width': 31.18,
            'depth': 33.27,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': MK2LongMill30x30File,
    },
    {
        'id': 1,
        'company': 'Sienci Labs',
        'name': 'LongMill MK2',
        'type': '48x30',
        'version': 'MK2',
        'mm': {
            'width': 1279.9,
            'depth': 845,
            'height': 114.3
        },
        'in': {
            'width': 50.39,
            'depth': 33.27,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'eepromSettings': MK2LongMill48x30File,
    },
    {
        'id': 2,
        'company': 'Sienci Labs',
        'name': 'LongMill MK2',
        'type': '12x30',
        'version': 'MK2',
        'mm': {
            'width': 792,
            'depth': 345,
            'height': 114.3
        },
        'in': {
            'width': 31.18,
            'depth': 13.58,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': MK2LongMill12x30File,
    },
    {
        'id': 7,
        'company': 'Sienci Labs',
        'name': 'Mill One',
        'type': 'V1',
        'version': 'MK1',
        'mm': {
            'width': 234,
            'depth': 185,
            'height': 90
        },
        'in': {
            'width': 9.21,
            'depth': 7.28,
            'height': 3.54
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': millOneFile,
    },
    {
        'id': 8,
        'company': 'Sienci Labs',
        'name': 'Mill One',
        'type': 'V2',
        'version': 'MK1',
        'mm': {
            'width': 234,
            'depth': 185,
            'height': 90
        },
        'in': {
            'width': 9.21,
            'depth': 7.28,
            'height': 3.54
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': millOneFile,
    },
    {
        'id': 9,
        'company': 'Sienci Labs',
        'name': 'Mill One',
        'type': 'V3',
        'version': 'MK1',
        'mm': {
            'width': 258,
            'depth': 185,
            'height': 90
        },
        'in': {
            'width': 10.16,
            'depth': 7.28,
            'height': 3.54
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': millOneV3File,
    },
    {
        'id': 3,
        'company': 'Sienci Labs',
        'name': 'LongMill MK1',
        'type': '12x12',
        'version': 'MK1',
        'mm': {
            'width': 307,
            'depth': 345,
            'height': 114.3
        },
        'in': {
            'width': 12.09,
            'depth': 13.58,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': longMill12x12File,
    },
    {
        'id': 4,
        'company': 'Sienci Labs',
        'name': 'LongMill MK1',
        'type': '12x30',
        'version': 'MK1',
        'mm': {
            'width': 792,
            'depth': 345,
            'height': 114.3
        },
        'in': {
            'width': 31.18,
            'depth': 13.58,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': longMill12x30File,
    },
    {
        'id': 5,
        'company': 'Sienci Labs',
        'name': 'LongMill MK1',
        'type': '30x30',
        'version': 'MK1',
        'mm': {
            'width': 792,
            'depth': 845,
            'height': 114.3
        },
        'in': {
            'width': 31.18,
            'depth': 33.27,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': longMill30x30File,
    },
    {
        'id': 6,
        'company': 'Sienci Labs',
        'name': 'LongMill MK1',
        'type': '48x30',
        'version': 'MK1',
        'mm': {
            'width': 1279.9,
            'depth': 845,
            'height': 114.3
        },
        'in': {
            'width': 50.39,
            'depth': 33.27,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'eepromSettings': MK1LongMill48x30File,
    },
    {
        'id': 10,
        'company': '',
        'name': 'Shapeoko',
        'type': '',
        'mm': {
            'width': 304,
            'depth': 304.8,
            'height': 63.5
        },
        'in': {
            'width': 11.97,
            'depth': 12,
            'height': 2.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false
    },
    {
        'id': 18,
        'company': '',
        'name': 'X-Carve',
        'type': '',
        'mm': {
            'width': 1219.2,
            'depth': 609.6,
            'height': 101.6
        },
        'in': {
            'width': 48,
            'depth': 24,
            'height': 4
        },
        'endstops': true,
        'spindle': true,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 19,
        'company': '',
        'name': 'Nomad',
        'type': '',
        'mm': {
            'width': 1219.2,
            'depth': 609.6,
            'height': 101.6
        },
        'in': {
            'width': 48,
            'depth': 24,
            'height': 4
        },
        'endstops': true,
        'spindle': true,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 22,
        'company': '',
        'name': 'Onefinity',
        'type': '',
        'mm': {
            'width': 819.15,
            'depth': 819.15,
            'height': 113.35
        },
        'in': {
            'width': 32.25,
            'depth': 32.25,
            'height': 4.46
        },
        'endstops': true,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 23,
        'company': '',
        'name': 'OpenBuilds',
        'type': '',
        'mm': {
            'width': 270,
            'depth': 270,
            'height': 80
        },
        'in': {
            'width': 10.63,
            'depth': 10.63,
            'height': 3.15
        },
        'endstops': true,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 33,
        'company': '',
        'name': 'Ooznest',
        'type': '',
        'mm': {
            'width': 300,
            'depth': 270,
            'height': 47
        },
        'in': {
            'width': 11.81,
            'depth': 10.63,
            'height': 1.85
        },
        'endstops': true,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 34,
        'company': '',
        'name': 'MillRight',
        'type': '',
        'mm': {
            'width': 260,
            'depth': 260,
            'height': 50
        },
        'in': {
            'width': 10.24,
            'depth': 10.24,
            'height': 1.97
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 41,
        'company': '',
        'name': 'CNC4newbie',
        'type': '',
        'mm': {
            'width': 400.05,
            'depth': 368.3,
            'height': 177.8
        },
        'in': {
            'width': 15.75,
            'depth': 14.5,
            'height': 7
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 43,
        'company': '',
        'name': 'BobsCNC',
        'type': '',
        'mm': {
            'width': 457.2,
            'depth': 406.4,
            'height': 83.82
        },
        'in': {
            'width': 18,
            'depth': 16,
            'height': 3.3
        },
        'endstops': true,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 44,
        'company': '',
        'name': 'YoraHome',
        'type': '',
        'mm': {
            'width': 609.6,
            'depth': 609.6,
            'height': 90.17
        },
        'in': {
            'width': 24,
            'depth': 24,
            'height': 3.55
        },
        'endstops': true,
        'spindle': true,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 47,
        'company': '',
        'name': 'SainSmart',
        'type': '',
        'mm': {
            'width': 180,
            'depth': 100,
            'height': 45
        },
        'in': {
            'width': 7.09,
            'depth': 3.94,
            'height': 1.77
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 50,
        'company': '',
        'name': 'WhittleCNC',
        'type': '',
        'mm': {
            'width': 228,
            'depth': 356,
            'height': 203
        },
        'in': {
            'width': 9,
            'depth': 14,
            'height': 8
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 51,
        'company': '',
        'name': 'Evo-One',
        'type': '',
        'mm': {
            'width': 530,
            'depth': 450,
            'height': 465
        },
        'in': {
            'width': 20.8,
            'depth': 17.7,
            'height': 18.3
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 52,
        'company': '',
        'name': 'Generic CNC',
        'type': '',
        'mm': {
            'width': 530,
            'depth': 450,
            'height': 465
        },
        'in': {
            'width': 20.8,
            'depth': 17.7,
            'height': 18.3
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
    },
    {
        'id': 53,
        'company': 'Sienci Labs',
        'name': 'SLB',
        'type': '',
        'version': '',
        'mm': {
            'width': 792,
            'depth': 845,
            'height': 114.3
        },
        'in': {
            'width': 31.18,
            'depth': 33.27,
            'height': 4.5
        },
        'endstops': false,
        'spindle': false,
        'coolant': false,
        'laser': false,
        'laserOnOutline': false,
        'eepromSettings': DefaultSLBSettings,
        isHal: true
    }
];
