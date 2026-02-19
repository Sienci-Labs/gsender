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

import * as longMillGrblEEPROM from './grbl/longmill';
import * as longMillGrblHALEEPROM from './grblHAL/longmill';
import * as millOneGrblEEPROM from './grbl/millone';
import * as altmillSettings from './grblHAL/Altmill';

export default [
    {
        id: 0,
        company: 'Sienci Labs',
        name: 'AltMill 4X4',
        type: '',
        version: '',
        mm: {
            width: 1260,
            depth: 1248,
            height: 170,
        },
        eepromSettings: altmillSettings.DEFAULT,
        grblHALeepromSettings: altmillSettings.DEFAULT,
        orderedSettings: altmillSettings.ALTMILL_ORDERED,
    },
    {
        id: 2,
        company: 'Sienci Labs',
        name: 'AltMill 2x4',
        type: '',
        version: '',
        mm: {
            width: 1260,
            depth: 1248,
            height: 170,
        },
        eepromSettings: altmillSettings.DEFAULT_2X4,
        grblHALeepromSettings: altmillSettings.DEFAULT_2X4,
        orderedSettings: altmillSettings.ALTMILL_ORDERED,
    },
    {
        id: 4,
        company: 'Sienci Labs',
        name: 'AltMill 4x8',
        type: '',
        version: '',
        mm: {
            width: 1260,
            depth: 1248,
            height: 170,
        },
        eepromSettings: altmillSettings.DEFAULT_4X8,
        grblHALeepromSettings: altmillSettings.DEFAULT_4X8,
        orderedSettings: altmillSettings.ALTMILL_ORDERED,
    },
    {
        id: 5,
        company: 'Sienci Labs',
        name: 'LongMill MK2',
        type: '12x30',
        version: 'MK2',
        mm: {
            width: 792,
            depth: 345,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK2_12x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK2_12x30,
    },
    {
        id: 6,
        company: 'Sienci Labs',
        name: 'LongMill MK2',
        type: '30x30',
        version: 'MK2',
        mm: {
            width: 792,
            depth: 845,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK2_30x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK2_30x30,
    },
    {
        id: 7,
        company: 'Sienci Labs',
        name: 'LongMill MK2',
        type: '48x30',
        version: 'MK2',
        mm: {
            width: 1279.9,
            depth: 845,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK2_48x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK2_48x30,
    },
    {
        id: 10,
        company: 'Sienci Labs',
        name: 'LongMill MK1',
        type: '12x12',
        version: 'MK1',
        mm: {
            width: 307,
            depth: 345,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK1_12x12,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK1_12x12,
    },
    {
        id: 11,
        company: 'Sienci Labs',
        name: 'LongMill MK1',
        type: '12x30',
        version: 'MK1',
        mm: {
            width: 792,
            depth: 345,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK1_12x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK1_12x30,
    },
    {
        id: 12,
        company: 'Sienci Labs',
        name: 'LongMill MK1',
        type: '30x30',
        version: 'MK1',
        mm: {
            width: 792,
            depth: 845,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK1_30x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK1_30x30,
    },
    {
        id: 13,
        company: 'Sienci Labs',
        name: 'LongMill MK1',
        type: '48x30',
        version: 'MK1',
        mm: {
            width: 1279.9,
            depth: 845,
            height: 114.3,
        },
        eepromSettings: longMillGrblEEPROM.LONGMILL_MK1_48x30,
        grblHALeepromSettings: longMillGrblHALEEPROM.LONGMILL_MK1_48x30,
    },
    {
        id: 15,
        company: 'Sienci Labs',
        name: 'Mill One',
        type: 'V1',
        version: 'MK1',
        mm: {
            width: 234,
            depth: 185,
            height: 90,
        },
        eepromSettings: millOneGrblEEPROM.MILL_ONE_V1_AND_V2,
    },
    {
        id: 16,
        company: 'Sienci Labs',
        name: 'Mill One',
        type: 'V2',
        version: 'MK1',
        mm: {
            width: 234,
            depth: 185,
            height: 90,
        },
        eepromSettings: millOneGrblEEPROM.MILL_ONE_V1_AND_V2,
    },
    {
        id: 17,
        company: 'Sienci Labs',
        name: 'Mill One',
        type: 'V3',
        version: 'MK1',
        mm: {
            width: 258,
            depth: 185,
            height: 90,
        },
        eepromSettings: millOneGrblEEPROM.MILL_ONE_V3,
    },
    {
        id: 30,
        company: '',
        name: 'Generic CNC',
        type: '',
        version: '',
        mm: {
            width: 530,
            depth: 450,
            height: 465,
        },
    },
    {
        id: 31,
        company: '',
        name: 'Shapeoko',
        type: '',
        version: '',
        mm: {
            width: 304,
            depth: 304.8,
            height: 63.5,
        },
    },
    {
        id: 32,
        company: '',
        name: 'X-Carve',
        type: '',
        version: '',
        mm: {
            width: 1219.2,
            depth: 609.6,
            height: 101.6,
        },
    },
    {
        id: 33,
        company: '',
        name: 'Nomad',
        type: '',
        version: '',
        mm: {
            width: 1219.2,
            depth: 609.6,
            height: 101.6,
        },
    },
    {
        id: 34,
        company: '',
        name: 'Onefinity',
        type: '',
        version: '',
        mm: {
            width: 819.15,
            depth: 819.15,
            height: 113.35,
        },
    },
    {
        id: 35,
        company: '',
        name: 'OpenBuilds',
        type: '',
        version: '',
        mm: {
            width: 270,
            depth: 270,
            height: 80,
        },
    },
    {
        id: 36,
        company: '',
        name: 'Ooznest',
        type: '',
        version: '',
        mm: {
            width: 300,
            depth: 270,
            height: 47,
        },
    },
    {
        id: 37,
        company: '',
        name: 'MillRight',
        type: '',
        version: '',
        mm: {
            width: 260,
            depth: 260,
            height: 50,
        },
    },
    {
        id: 41,
        company: '',
        name: 'CNC4newbie',
        type: '',
        version: '',
        mm: {
            width: 400.05,
            depth: 368.3,
            height: 177.8,
        },
    },
    {
        id: 43,
        company: '',
        name: 'BobsCNC',
        type: '',
        version: '',
        mm: {
            width: 457.2,
            depth: 406.4,
            height: 83.82,
        },
    },
    {
        id: 44,
        company: '',
        name: 'YoraHome',
        type: '',
        version: '',
        mm: {
            width: 609.6,
            depth: 609.6,
            height: 90.17,
        },
    },
    {
        id: 47,
        company: '',
        name: 'SainSmart',
        type: '',
        version: '',
        mm: {
            width: 180,
            depth: 100,
            height: 45,
        },
    },
    {
        id: 50,
        company: '',
        name: 'WhittleCNC',
        type: '',
        version: '',
        mm: {
            width: 228,
            depth: 356,
            height: 203,
        },
    },
    {
        id: 51,
        company: '',
        name: 'Evo-One',
        type: '',
        version: '',
        mm: {
            width: 530,
            depth: 450,
            height: 465,
        },
    },
];
