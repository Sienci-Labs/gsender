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
        'version': '1.5.2',
        'date': 'July 15th, 2025',
        'notes': [
            'Fix issues with remote mode disconnecting main client and jobs stopping when connecting from remote mode.',
            'Significantly sped up file loading and rendering on larger files',
            'Job end notifications will no longer appear if toggled off',
            'SVG visualization no longer teeny-tiny on inches postprocessor files',
            'Plus and Minus buttons returned to jog speeds with the prior existing logic',
            'AutoZero touchplate renamed to just AutoZero',
            'Added new Config option for Jog Delay, which configures how long a keypress/UI press/gamepad press before swapping to continuous jogging.',
            'Commands sent later in connection cycle to reduce situations where Error 1 occurs when unlocking and resetting the board',
            'Generating a surfacing file no longer causes issues on main visualizer if not sent there',
            'Motors sections again will disappear from config when empty',
            'Restore defaults and default highlight works correctly in Config on settings considered hybrid between grbl/grblHAL',
            'Prevented situations where alarm list was not populating correctly',
            'Continuous jog without soft limits now sends more sane values when jogging in Inches across both controllers',
            'Load bar now appears correctly in surfacing and rotary surfacing tools',
            'Stopping a file that has an early M0 already sent will no longer pop up the pause modal',
            'Stock turning and Probe Rotary Z disabled for grbl controllers when in non-Rotary mode',
            'Config look and Feel tweaks',
            'Shortcuts rearranged so more commonly set ones are higher up',
            'File stat feed rates now convert correctly',
            'Zero All on grblHAL no longer sends Zero on A if A Axis not reported',
            'Various look and feel changes',
        ]
    },
    {
        'version': '1.5.1',
        'date': 'June 27th, 2025',
        'notes': [
            'Addressed issues where jog values kept reconverting.',
            'Fixed crash when importing settings.',
            'Updated some AltMill and LongMill default values.',
            'Removed Zoom icons from visualizer.',
            'Override sliders have switched to decaf and are now less jumpy.',
            'Fixed unit issue with Go To popover and default values no longer populate Z with Y value',
            'Using tuning tools (Squaring and Steps/mm) now refresh EEPROM state and respect UI units',
            'Abs/Inc toggle in go to moved to top.',
            'Fixed issue where M0 in macros could result in a paused feeder state after unlocking preventing further code sending',
            'Fixed issue where Machine status overlapped unlock and connect on smaller resolutions and made them unclickable',
            'Disabling a drawer tool now defaults you to the first drawer element',
            'Fixed issue with tool select in probing working inconsistently and defaulting to Auto',
            'Rotary Axis travel resolution and maximum rate appearing again when connected with GRBL.',
        ]
    },
    {
        'version': '1.5.0',
        'date': 'June 18th, 2025',
        'notes': [
            'All new user experience - we\'ve streamlined and modernized the UI, with a focus on touch device and usability.  It should seem familiar to previous gSender users with a number of new improvements.',
            'Firmware now detected on connection - no more firmware selector, gSender can just use the correct controller type.',
            'All new Stats tool which collates your job run statistics, alarms and errors, maintenance tasks, and diagnostics.',
            'Firmware settings and gSender settings have been combined into a new streamlined Config tool, allowing you to easily configure your machine setup and application behaviour.',
            'All settings (both EEPROM and application) can be filtered by non-default and restored to default values at a single click.',
            'Rotary now a first-class citizen - enabling rotary functionality adds all DRO and jogging controls you could need to the main UI.',
            'Some new perspectives - gSender now comes with a configurable dark mode, selectable in config.  As well, portrait mode is available by rotating your device.',
            'Updated remote mode - more functionality at your finger tips',
            'What\'d I miss - all new notifications center to keep you informed about what\'s happened when running your job.',
            'Helper - Alarm explanations and toolchanging are now helpers, which will pop up as required.  ',
            'Visualizer - Lightweight mode has had some behaviour changes, and better supports touch movements like pinch and zoom.',
            'Tweak to 30X30 machine profile for missing acceleration change for $111.',
            'Tools - All tools and widgets are collated on the new Tools interface, allowing you to easily access tools and widgets'
        ]
    },
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
