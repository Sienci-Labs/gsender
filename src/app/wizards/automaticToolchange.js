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
import store from 'app/store';

const wizard = {
    steps: [
        {
            title: 'Setup',
            substeps: [
                {
                    title: 'Safety First',
                    description: 'PH COPY - Turn off router or verify that spindle is off.  Save current modals and position',
                    actions: [
                        {
                            label: 'Save Positions and Modals',
                            cb: () => {
                                const probeProfile = store.get('workspace.probeProfile');
                                const position = store.get('workspace.toolChangePosition');
                                const { zThickness } = probeProfile;
                                controller.command('gcode', [
                                    '%wait',
                                    `%global.toolchange.PROBE_THICKNESS=${zThickness.mm}`,
                                    '%global.toolchange.PROBE_DISTANCE=80',
                                    '%global.toolchange.PROBE_FEEDRATE=200',
                                    '%global.toolchange.XPOS=posx',
                                    '%global.toolchange.YPOS=posy',
                                    '%global.toolchange.ZPOS=posz',
                                    `%global.toolchange.PROBE_POS_X=${position.x}`,
                                    `%global.toolchange.PROBE_POS_Y=${position.y}`,
                                    `%global.toolchange.PROBE_POS_Z=${position.z}`,
                                    'global.toolchange.Z_SAFE_HEIGHT=-10',
                                    '%global.toolchange.UNITS=modal.units',
                                    '%global.toolchange.SPINDLE=modal.spindle',
                                    '%global.toolchange.DISTANCE=modal.distance',
                                    '%global.toolchange.FEEDRATE=modal.feedrate',
                                    'M5',
                                    'G91 G21 G0Z5',
                                    '(Toolchange variables:)',
                                    '([JSON.stringify(global.toolchange)])',
                                ]);
                            }
                        }
                    ]
                },
                {
                    title: 'Touchplate Setup',
                    description: 'PH COPY - Verify your probe is setup correctly and all collets are attached.'
                },
            ]
        },
        {
            title: 'Setup Probe',
            substeps: [
                {
                    title: 'Probe Initial Tool Length or confirm',
                    description: 'PH COPY - If you haven\'t probed your initial tool length, do so now by pressing \'Probe Tool Length\'.  Otherwise, continue.',
                    actions: [
                        {
                            label: 'Probe Initial Tool Length',
                            cb: () => {
                                controller.command('gcode', [
                                    'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G53 G0 X[global.toolchange.PROBE_POS_X] Y[global.toolchange.PROBE_POS_Y]',
                                    '(This is 10 above configured location)',
                                    'G53 G0 Z[global.toolchange.PROBE_POS_Z + 10]',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z5',
                                    'G38.2 Z-10 F40',
                                    'G4 P0.3',
                                    '%global.toolchange.TOOL_OFFSET=posz',
                                    '(TLO set: [global.toolchange.TOOL_OFFSET])',
                                    'G91',
                                    'G0 Z5',
                                    'G90',
                                    'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]'
                                ]);
                            }
                        },
                        {
                            label: 'Tool Length Already Set',
                            cb: () => {
                                controller.command('gcode', [
                                    '(TLO set: [global.toolchange.TOOL_OFFSET])',
                                    '(If the above is not valid, re-run Probe Initial Tool Length action)'
                                ]);
                            }
                        }
                    ]
                },
                {
                    title: 'Change Tool',
                    description: 'PH COPY - Change the tool to the requested bit.'
                },
            ]
        },
        {
            title: 'Probe New Tool',
            substeps: [
                {
                    title: 'Probe',
                    description: 'PH COPY - Probe new tool length.  This will move back to the configured probe position.',
                    actions: [
                        {
                            label: 'Probe New Tool Length',
                            cb: () => {
                                controller.command('gcode', [
                                    '(Moving back to configured location)',
                                    'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G53 G0 X[global.toolchange.PROBE_POS_X] Y[global.toolchange.PROBE_POS_Y]',
                                    '(This is 10 above configured location)',
                                    'G53 G0 Z[global.toolchange.PROBE_POS_Z + 10]',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z5',
                                    'G38.2 Z-10 F40',
                                    'G4 P0.3',
                                    'G10 L20 Z[global.toolchange.TOOL_OFFSET]',
                                    '(Set Z to Tool offset)'
                                ]);
                            }
                        }
                    ]
                }
            ]
        },
        {
            title: 'Resume Path',
            substeps: [
                {
                    title: 'Resume Program',
                    description: 'PH COPY - Move router back to initial position, restore modals, turn it on, resume cutting.',
                    actions: [
                        {
                            label: 'Prepare for Resume',
                            cb: () => {
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G91 G21 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G90 G21 G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]',
                                    'G90 G21 G0 Z[global.toolchange.ZPOS]',
                                    '(Restore initial modals)',
                                    '[global.toolchange.SPINDLE] [global.toolchange.UNITS] [global.toolchange.DISTANCE] [global.toolchange.FEEDRATE]'
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
