/*
 * Copyright (C) 2022 Sienci Labs Inc.
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
import controller from 'app/lib/controller';
import React from 'react';
import { getProbeSettings, getUnitModal, getToolString } from 'app/lib/toolChangeUtils';

const wizard = {
    intro: {
        icon: 'fas fa-caution',
        description: 'Tool Change detected, stay clear of the machine! Wait until initial movements are complete!'
    },
    onStart: () => {
        const settings = getProbeSettings();

        return [
            '%wait',
            `%global.toolchange.PROBE_THICKNESS=${settings.zProbeThickness}`,
            `%global.toolchange.PROBE_DISTANCE=${settings.zProbeDistance}`,
            `%global.toolchange.PROBE_FEEDRATE=${settings.fastSpeed}`,
            `%global.toolchange.PROBE_SLOW_FEEDRATE=${settings.slowSpeed}`,
            `%global.toolchange.RETRACT=${settings.retract}`,
            '%global.toolchange.XPOS=posx',
            '%global.toolchange.YPOS=posy',
            '%global.toolchange.ZPOS=posz',
            '%global.toolchange.UNITS=modal.units',
            '%global.toolchange.SPINDLE=modal.spindle',
            '%global.toolchange.DISTANCE=modal.distance',
            '%global.toolchange.FEEDRATE=programFeedrate',
            '([JSON.stringify(global.toolchange)])',
            'M5',
            'G91 G21',
            '(Toolchange initiated)',
        ];
    },
    steps: [
        {
            title: 'Starting Off',
            substeps: [
                {
                    title: 'Safety First',
                    description: () => <div>Jog your machine to a place you can reach using the jog controls and ensure that your router/spindle is turned off and has fully stopped spinning.</div>,
                    overlay: false,
                },
                {
                    title: 'Change Bit',
                    description: () => `Change over to the next tool (${getToolString()})`,
                    overlay: false
                }
            ]
        },
        {
            title: 'Probe New Tool',
            substeps: [
                {
                    title: 'Reset the Z',
                    description: 'Use jogging or X and Y gotos to bring your CNC back over to where you initially set the project zero. If you used a touch plate be sure to place the tool over the plate and attach the magnet.',
                    overlay: false,
                    actions: [
                        {
                            label: 'Probe Z (touch plate)',
                            cb: () => {
                                controller.command('gcode', [
                                    '(Probing Z 0 with probe thickness of [global.toolchange.PROBE_THICKNESS]mm)',
                                    'G91',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-10 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    '%wait',
                                    'G10 L20 P0 Z[global.toolchange.PROBE_THICKNESS]',
                                    'G0 G21 Z10'
                                ]);
                            }
                        },
                        {
                            label: 'Set Z0 (paper method)',
                            cb: () => {
                                controller.command('gcode', [
                                    '(Setting Z 0)',
                                    'G10 L20 P0 Z0',
                                    'G21'
                                ]);
                            }
                        },
                    ]
                }
            ]
        },
        {
            title: 'Resume Job',
            substeps: [
                {
                    title: 'Resume Job',
                    description: 'If everything looks good, prepare for your machine to move back to the cutting area and continue as expected. Remove the touch plate magnet and turn on your router if you have them.',
                    overlay: false,
                    actions: [
                        {
                            label: 'Resume Job',
                            cb: () => {
                                const prefUnit = getUnitModal();
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G21',
                                    `G90 ${prefUnit} G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]`,
                                    `G90 ${prefUnit} G0 Z[global.toolchange.ZPOS]`,
                                    '(Restore initial modals)',
                                    'M3 [global.toolchange.UNITS] [global.toolchange.DISTANCE] [global.toolchange.FEEDRATE]',
                                    '%toolchange_complete'
                                ]);
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

export default wizard;
