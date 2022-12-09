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
        return 'no T command parsed';
    }
    return `last T command was T${tool}`;
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
            title: 'Change Bit',
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
                                    'G91 G21 G0Z5',
                                    '(Toolchange variables:)',
                                    '([JSON.stringify(global.toolchange)])',
                                ]);
                            }
                        }
                    ]
                },
                {
                    title: 'Change Bit',
                    description: () => `PH COPY - Change tool to requested bit - ${getToolString()}`
                }
            ]
        },
        {
            title: 'Setup Probe',
            substeps: [
                {
                    title: 'Touchplate Setup',
                    description: 'PH COPY - Setup touchplate and attach continuity collets.'
                },
                {
                    title: 'Position Router',
                    description: 'PH COPY - Jog router into position above the touch plate using the jog controls'
                }
            ]
        },
        {
            title: 'Probe Tool',
            substeps: [
                {
                    title: 'Probe',
                    description: 'PH COPY - Probe tool length',
                    actions: [
                        {
                            label: 'Probe Z',
                            cb: () => {
                                controller.command('gcode', [
                                    '(Probing Z 0 with probe thickness of [global.toolchange.PROBE_THICKNESS]mm)',
                                    'G91',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z5',
                                    'G38.2 Z-10 F40',
                                    '%wait',
                                    'G10 L20 P0 Z[global.toolchange.PROBE_THICKNESS]',
                                    'G0 G21 Z10'
                                ]);
                            }
                        },
                        {
                            label: 'Set Z0 at Location',
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
            title: 'Resume Path',
            substeps: [
                {
                    title: 'Resume Program',
                    description: 'PH COPY - Detach and remove your touchplate from the work area.  The following will restore modals, and move back to initial position.  Remember to turn on your router before resuming.',
                    actions: [
                        {
                            label: 'Prepare for Resume',
                            cb: () => {
                                const prefUnit = getUnitModal();
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G91 G21 G0 Z15',
                                    `G90 ${prefUnit} G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]`,
                                    `G90 ${prefUnit} G0 Z[global.toolchange.ZPOS]`,
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
