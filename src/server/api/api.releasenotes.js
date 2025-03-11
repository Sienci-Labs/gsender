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

// import fs from 'fs';
// import path from 'path';

const releases = [
    {
        'version': '1.4.11',
        'date': 'December 16th, 2024',
        'notes': [
            'Added "Skip Dialog" option to code toolchange which combines both blocks and skips the "Continue" dialog',
            'Diagnostics now generates a zip file which includes the original diagnostic PDF, a copy of current gSender settings, and any loaded toolpath for better support.',
            'Continuous jogging now bitwise compares homing location to avoid non-XYZ axes causing invalid corner detection.',
            'You are now able to update EEPROM values using the firmware tool when in Alarm state.',
            'Start from line now starts the spindle after the Z safe movement but before X and Y.',
            'Fix for A axis jog keybinds not working on standard GRBL controller.',
            'Reverted HAL changes $G using the realtime alternative to reduce instances of error 1 since it was not playing nicely with the new line parser.',
            'Fix for available axes and axes count not being emitted properly when disconnecting and reconnecting over ethernet.',
            'Auto Zero touch plate probing now properly converts bit diameter when using imperial preferred units and a specific bit size.',
            'Available ports are now case insensitive when matching known controller types (Thanks Dymk!)',
            'Macros no longer overflow the macro widget.',
            'Tweak to 30X30 machine profile for missing acceleration change for $111.',
            'Fixed rare situation where connecting to grblHAL controller, disconnecting, and reconnecting to GRBL controller caused invalid laser/spindle mode toggle behaviour.'
        ]
    },
    {
        'version': '1.4.10',
        'date': 'October 28, 2024',
        'notes': [
            'Jog no longer sends double jog commands on touch devices',
            '$G output emitted to UI when connected using grblHAL and manually sent',
            'Altmill profile updated $103 A steps to account for compiled microstepping',
            'SLB profiles updated with new values',
            'Updated defaults on Mk2, Mk1, and MillOne profiles',
            'AutoZero touch routine updated when running specific diameter bits to be more accurate, and retract distance on Z slightly increased for non-tip routines.',
            'Rotary toggle no longer updates values when cancelled on grblHAL.',
            'Changed Spindle/Laser toggle behaviour for when to use gSender settings vs EEPROM settings for laser offset and spindle/laser min and max.',
            'Custom theme visualizer background now saving correctly.',
            'Altmill profile now at top of profiles with other Sienci Machines'
        ]
    },
    {
        'version': '1.4.9',
        'date': 'August 5, 2024',
        'notes': [
            'Fix for time remaining converting timestamps incorrectly',
            'Firmware groups now always emitted to UI on connection',
            'Reduced situations where error 1 should appear on connection or homing',
            'Alterations to Altmill default profile for Z acceleration',
            'Enabling rotary mode for grblHAL now disables homing, and disabling rotary mode restores your previous homing value',
            'Updated Longmill HAL A axis travel resolution for compiled microstepping value',
            'Main window should no longer be focused on load file dialog'
        ]
    }
];

export const fetchReleaseNotes = (req, res) => {
    try {
        // Use an absolute path to ensure we find the file
        // const releasesPath = path.resolve(__dirname, '../lib/releases.json');
        // console.log('Loading release notes from:', releasesPath);
        // if (!fs.existsSync(releasesPath)) {
        //     console.error('Release notes file not found at:', releasesPath);
        //     return res.status(404).send({ error: 'Release notes file not found', releasesPath });
        // }
        // const releases = JSON.parse(fs.readFileSync(releasesPath, 'utf8'));
        return res.send(releases);
    } catch (error) {
        console.error('Error reading release notes:', error);
        return res.status(500).send({ error: 'Failed to fetch release notes' });
    }
};
