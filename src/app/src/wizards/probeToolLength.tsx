/*
 * Copyright (C) 2026 Sienci Labs Inc.
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
import { getProbeSettings, getUnitModal } from 'app/lib/toolChangeUtils';
import { store as reduxStore } from 'app/store/redux';
import get from 'lodash/get';

// $132 is max z travel, if soft limits ($20) enabled we need to make sure probe distance will not exceed max limits
const calculateMaxZProbeDistance = (_zProbeDistance = 30) => {
    const state = reduxStore.getState();
    const maxZTravel = Number(get(state, 'controller.settings.settings.$132'));

    const position = store.get('workspace.toolChangePosition');
    const curZPos = Math.abs(position.z);

    return (maxZTravel - curZPos - 2).toFixed(3);
};

const createWizard = () => {
    return {
        intro: {
            icon: 'fas fa-ruler-vertical',
            description:
                'Prepare to probe the initial tool length. Ensure your router/spindle is turned off and has fully stopped spinning.',
        },
        onStart: () => {
            const settings = getProbeSettings();
            const position = store.get('workspace.toolChangePosition');
            // Get $13 value for adjustment of Z Safe Height
            const state = reduxStore.getState();
            const $13 = get(state, 'controller.settings.settings.$13', '0');
            const zSafe = $13 === '1' ? '-0.5' : '-10';

            const zProbeDistance = calculateMaxZProbeDistance(
                settings.zProbeDistance,
            );

            controller.command('gcode', [
                '%wait',
                `%global.toolchange.PROBE_THICKNESS_MM=${settings.zProbeThickness}`,
                `%global.toolchange.PROBE_DISTANCE=${zProbeDistance}`,
                `%global.toolchange.PROBE_FEEDRATE=${settings.fastSpeed}`,
                `%global.toolchange.PROBE_SLOW_FEEDRATE=${settings.slowSpeed}`,
                `%global.toolchange.RETRACT=${settings.retract}`,
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
                '%global.toolchange.XPOS=posx',
                '%global.toolchange.YPOS=posy',
                '%global.toolchange.ZPOS=posz',
                'G91 G21',
                'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                '(Tool probe initiated)',
            ]);
        },
        steps: [
            {
                title: 'Probe Initial Tool',
                substeps: [
                    {
                        title: 'Measure Tool Length',
                        description:
                            'Ensure that your router/spindle is turned off and has fully stopped spinning. Click the button below to probe the length of the current tool.',
                        overlay: false,
                        actions: [
                            {
                                label: 'Probe Tool Length',
                                cb: () => {
                                    controller.command('gcode', [
                                        'G91 G21',
                                        'G49', // cancel applied TLO offsets
                                        'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                        'G53 G0 X[global.toolchange.PROBE_POS_X] Y[global.toolchange.PROBE_POS_Y]',
                                        'G53 G0 Z[global.toolchange.PROBE_POS_Z]',
                                        'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                        'G0 Z[global.toolchange.RETRACT]',
                                        'G38.2 Z-10 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                        'G4 P0.3',
                                        'G43.1 Z0', // Set Z0 on initial tool offset
                                        '%global.toolchange.TOOL_OFFSET=posz',
                                        '(TLO set: [global.toolchange.TOOL_OFFSET])',
                                        'G0 Z[global.toolchange.RETRACT]',
                                        'G90 G21',
                                        'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    ]);
                                },
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Resume',
                substeps: [
                    {
                        title: 'Resume Operation',
                        description:
                            'Tool length has been probed and set. Click the button below to continue with your operation. Turn on your router if you have one.',
                        overlay: false,
                        actions: [
                            {
                                label: 'Resume',
                                cb: () => {
                                    const unit = getUnitModal();
                                    controller.command('gcode', [
                                        '(Returning to initial position)',
                                        'G53 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                        `G90 ${unit} G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]`,
                                        `G90 ${unit} G0 Z[global.toolchange.ZPOS]`,
                                        '(Restore initial modals)',
                                        'M3 [global.toolchange.UNITS] [global.toolchange.DISTANCE] [global.toolchange.FEEDRATE]',
                                        '%toolchange_complete',
                                    ]);
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };
};

export default createWizard;
