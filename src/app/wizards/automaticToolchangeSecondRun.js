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
        retract: probeSettings.retractionDistance.mm,
        zProbeDistance: probeSettings.zProbeDistance.mm,
    };
};

const getToolString = () => {
    const state = reduxStore.getState();
    const tool = get(state, 'controller.state.parserstate.modal.tool', '');
    return `T${tool}`;
};

// $132 is max z travel, if soft limits ($20) enabled we need to make sure probe distance will not exceed max limits
const calculateMaxZProbeDistance = (zProbeDistance = 30) => {
    const state = reduxStore.getState();
    const softLimits = Number(get(state, 'controller.settings.settings.$20', 0));

    // Can safely use configured Z probe distance if soft limits not enabled
    if (softLimits === 0) {
        return zProbeDistance;
    }
    const maxZTravel = Number(get(state, 'controller.settings.settings.$132'));
    const curZPos = Math.abs(get(state, 'controller.mpos.z'));

    // If we think we'll trigger a limit switch, we need to calculate the max value we actually can probe
    if (curZPos + zProbeDistance >= maxZTravel) {
        zProbeDistance = maxZTravel - curZPos - 1;
    }

    return zProbeDistance;
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
        const settings = getProbeSettings();
        const probeProfile = store.get('workspace.probeProfile');
        const position = store.get('workspace.toolChangePosition');
        const { zThickness } = probeProfile;
        // Get $13 value for adjustment of Z Safe Height
        const state = reduxStore.getState();
        const $13 = get(state, 'controller.settings.settings.$13', '0');
        const zSafe = ($13 === '1') ? '-0.5' : '-10';

        const zProbeDistance = calculateMaxZProbeDistance(settings.zProbeDistance);

        controller.command('gcode', [
            '%wait',
            `%global.toolchange.PROBE_THICKNESS_MM=${zThickness.mm}`,
            `%global.toolchange.PROBE_DISTANCE=${zProbeDistance}`,
            `%global.toolchange.PROBE_FEEDRATE=${settings.fastSpeed}`,
            `%global.toolchange.PROBE_SLOW_FEEDRATE=${settings.slowSpeed}`,
            `%global.toolchange.RETRACT=${settings.retract}`,
            '%global.toolchange.XPOS=posx',
            '%global.toolchange.YPOS=posy',
            '%global.toolchange.ZPOS=posz',
            `%global.toolchange.PROBE_POS_X=${position.x}`,
            `%global.toolchange.PROBE_POS_Y=${position.y}`,
            `%global.toolchange.PROBE_POS_Z=${position.z}`,
            `%global.toolchange.Z_SAFE_HEIGHT=${zSafe}`,
            '%global.toolchange.UNITS=modal.units',
            '%global.toolchange.SPINDLE=modal.spindle',
            '%global.toolchange.DISTANCE=modal.distance',
            '%global.toolchange.FEEDRATE=programFeedrate',
            'M5',
            '%wait',
            '([JSON.stringify(global.toolchange)])',
            'G91 G21',
            '(Toolchange initiated)',
        ]);
    },
    steps: [
        {
            title: 'Probe New Tool',
            substeps: [
                {
                    title: 'Change Tool',
                    description: () => <div>Ensure that your router/spindle is turned off and has fully stopped spinning, then change over to the next tool ({getToolString()}) and prepare to probe.</div>,
                    overlay: false,
                    actions: [
                        {
                            label: 'Probe Changed Tool',
                            cb: () => {
                                const modal = getUnitModal();
                                controller.command('gcode', [
                                    '(Moving back to configured location)',
                                    'G90 G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G90 G53 G0 X[global.toolchange.PROBE_POS_X] Y[global.toolchange.PROBE_POS_Y]',
                                    '(This is 10 above configured location)',
                                    'G53 G0 Z[global.toolchange.PROBE_POS_Z]',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-15 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    '(Set Z to Tool offset and wait)',
                                    `${modal} G10 L20 P0 Z[global.toolchange.TOOL_OFFSET + global.toolchange.RETRACT]`,
                                    '(Set Z to Tool offset and wait)',
                                    'G53 G21 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G21 G91',
                                ]);
                            }
                        }
                    ]
                },
            ]
        },
        {
            title: 'Resume Job',
            substeps: [
                {
                    title: 'Resume Job',
                    description: 'If everything looks good, prepare for your machine to move back to the cutting area and continue as expected. Turn on your router if you have one.',
                    overlay: false,
                    actions: [
                        {
                            label: 'Resume Cutting',
                            cb: () => {
                                const unit = getUnitModal();
                                controller.command('gcode', [
                                    '(Returning to initial position)',
                                    'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
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
