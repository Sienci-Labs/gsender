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
import store from 'app/store';
import reduxStore from 'app/store/redux';
import { get } from 'lodash';

const getProbeSettings = () => {
    const probeSettings = store.get('widgets.probe');
    return {
        slowSpeed: probeSettings.probeFeedrate.mm,
        fastSpeed: probeSettings.probeFastFeedrate.mm,
        retract: probeSettings.retractionDistance.mm
    };
};

const getToolString = () => {
    const state = reduxStore.getState();
    const tool = get(state, 'controller.state.parserstate.modal.tool');

    return `T${tool}`;
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
    intro: {
        icon: 'fas fa-caution',
        description: 'Tool Change detected, stay clear of the machine! Wait until initial movements are complete!'
    },
    onStart: () => {
        const probeProfile = store.get('workspace.probeProfile');
        const settings = getProbeSettings();
        const { zThickness } = probeProfile;

        return [
            '%wait',
            `%global.toolchange.PROBE_THICKNESS=${zThickness.mm}`,
            '%global.toolchange.PROBE_DISTANCE=80',
            `%global.toolchange.PROBE_FEEDRATE=${settings.fastSpeed}`,
            `%global.toolchange.PROBE_SLOW_FEEDRATE=${settings.slowSpeed}`,
            `%global.toolchange.RETRACT=${settings.retract}`,
            '%global.toolchange.XPOS=posx',
            '%global.toolchange.YPOS=posy',
            '%global.toolchange.ZPOS=posz',
            '%global.toolchange.UNITS=modal.units',
            '%global.toolchange.SPINDLE=modal.spindle',
            '%global.toolchange.DISTANCE=modal.distance',
            '%global.toolchange.FEEDRATE=modal.feedrate',
            'M5',
            '(Toolchange Initiated)',
        ];
    },
    steps: [
        {
            title: 'Starting Off',
            substeps: [
                {
                    title: 'Safety First',
                    description: () => <div>Jog your machine to the probe location using the jog controls and ensure that your router/spindle is turned off and has fully stopped spinning.</div>,
                    overlay: false,
                },
            ]
        },
        {
            title: 'Probe New Tool',
            substeps: [
                {
                    title: 'Change Tool',
                    description: () => <div>Change over to the next tool ({getToolString()}), attach the magnet, and position it to prepare to probe</div>,
                    overlay: false,
                    actions: [
                        {
                            label: 'Probe Changed Tool',
                            cb: () => {
                                const modal = getUnitModal();
                                controller.command('gcode', [
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-15 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    'G4 P0.3',
                                    '(Set Z to Tool offset and wait)',
                                    `${modal} G10 L20 Z[global.toolchange.TOOL_OFFSET]`,
                                    'G21 G91 Z10',
                                ]);
                            }
                        }
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
                            label: 'Start Spindle',
                            cb: () => {
                                controller.command('gcode', ['M3']);
                            }
                        },
                        {
                            label: 'Resume Cutting',
                            cb: () => {
                                const unit = getUnitModal();
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G21 G91 Z10',
                                    `G90 ${unit} G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]`,
                                    `G90 ${unit} G0 Z[global.toolchange.ZPOS]`,
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
