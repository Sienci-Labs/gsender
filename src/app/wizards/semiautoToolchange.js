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
import reduxStore from 'app/store/redux';
import { get } from 'lodash';


const getToolString = () => {
    const state = reduxStore.getState();
    const tool = get(state, 'controller.state.parserstate.modal.tool', '0');
    if (tool === '0') {
        return 'No T command parsed';
    }
    return `Last T command was T${tool}`;
};

const getUnitModal = () => {
    const state = reduxStore.getState();
    const $13 = get(state, 'controller.settings.settings.$13', '0');
    if ($13 === '1') {
        return 'G20';
    }
    return 'G21';
};

const wizard = {
    steps: [
        {
            title: 'Initial Setup',
            substeps: [
                {
                    title: 'Safety First',
                    description: 'PH COPY - Turn off router or verify that spindle is off.  Save current modals and position',
                    actions: [
                        {
                            label: 'Save Positions and Modals',
                            cb: () => {
                                const probeProfile = store.get('workspace.probeProfile');
                                const { zThickness } = probeProfile;
                                controller.command('gcode', [
                                    '%wait',
                                    `%global.toolchange.PROBE_THICKNESS=${zThickness.mm}`,
                                    '%global.toolchange.PROBE_DISTANCE=80',
                                    '%global.toolchange.PROBE_FEEDRATE=200',
                                    '%global.toolchange.XPOS=posx',
                                    '%global.toolchange.YPOS=posy',
                                    '%global.toolchange.ZPOS=posz',
                                    '%global.toolchange.UNITS=modal.units',
                                    '%global.toolchange.SPINDLE=modal.spindle',
                                    '%global.toolchange.DISTANCE=modal.distance',
                                    '%global.toolchange.FEEDRATE=modal.feedrate',
                                    'M5',
                                    '%wait',
                                    'G91 G21 G0Z5',
                                    '(Toolchange variables:)',
                                    '([JSON.stringify(global.toolchange)])',
                                ]);
                            }
                        }
                    ]
                },
                {
                    title: 'Position above touchplate',
                    description: 'PH COPY - Jog the router into position, about 10mm above the touchplate.'
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
                                    '(This is 10 above configured location)',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z5',
                                    'G38.2 Z-10 F40',
                                    'G4 P0.3',
                                    '%global.toolchange.TOOL_OFFSET=posz',
                                    '(TLO set: [global.toolchange.TOOL_OFFSET])',
                                    'G91 G21 G0 Z10',
                                    'G90'
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

            ]
        },
        {
            title: 'Change and Probe New Tool',
            substeps: [
                {
                    title: 'Change Tool',
                    description: () => `PH COPY - Change tool to requested bit - ${getToolString()}.`,
                },
                {
                    title: 'Probe',
                    description: 'PH COPY - Move back about 10mm above touchplate and re-probe.',
                    actions: [
                        {
                            label: 'Probe New Tool Length',
                            cb: () => {
                                const unit = getUnitModal();
                                controller.command('gcode', [
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z5',
                                    'G38.2 Z-10 F40',
                                    'G4 P0.3',
                                    '(Set Z to Tool offset and wait)',
                                    `${unit} G10 L20 Z[global.toolchange.TOOL_OFFSET]`,
                                    '(Set Z to Tool offset and wait)',
                                    'G21 G91 Z10',
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
                                const unit = getUnitModal();
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G21 G91 Z10',
                                    `G90 ${unit} G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]`,
                                    `G90 ${unit} G0 Z[global.toolchange.ZPOS]`,
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
