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
import {
    getProbeSettings,
    getUnitModal,
    getToolString,
} from 'app/lib/toolChangeUtils';
import { store as reduxStore } from 'app/store/redux';
import get from 'lodash/get';
import { convertToImperial } from 'app/lib/units';

// $132 is max z travel, if soft limits ($20) enabled we need to make sure probe distance will not exceed max limits
const calculateMaxZProbeDistance = (_zProbeDistance = 30) => {
    const state = reduxStore.getState();
    const maxZTravel = Number(get(state, 'controller.settings.settings.$132'));
    const $13 = get(state, 'controller.settings.settings.$13', '0');

    //const curZPos = Math.abs(Number(get(state, 'controller.mpos.z')));
    const position = store.get('workspace.toolChangePosition');
    const curZPos = Math.abs(position.z);

    console.log('curr z: ' + curZPos);
    console.log('max z: ' + maxZTravel);
    console.log('result: ' + (maxZTravel - curZPos - 2).toFixed(3));

    let result =
        $13 === '1'
            ? convertToImperial(maxZTravel - curZPos - 2)
            : (maxZTravel - curZPos - 2).toFixed(3);

    return result;
};

const wizard = {
    intro: {
        icon: 'fas fa-caution',
        description:
            'Tool Change detected, stay clear of the machine! Wait until initial movements are complete!',
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
            'G53 G0 X[global.toolchange.PROBE_POS_X] Y[global.toolchange.PROBE_POS_Y]',
            '(Toolchange initiated)',
        ]);
    },
    steps: [
        {
            title: 'Starting Off',
            substeps: [
                {
                    title: 'Safety First',
                    description:
                        'Ensure that your router/spindle is turned off and has fully stopped spinning and prepare to check the length of the current, initial cutting tool.',
                    overlay: false,
                    actions: [
                        {
                            label: 'Probe Initial Tool',
                            cb: () => {
                                controller.command('gcode', [
                                    'G53 G0 Z[global.toolchange.PROBE_POS_Z]',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-10 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G4 P0.3',
                                    '%global.toolchange.TOOL_OFFSET=(posz+(global.toolchange.RETRACT * -1)).toFixed(3)',
                                    '(TLO set: [global.toolchange.TOOL_OFFSET])',
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
            title: 'Probe New Tool',
            substeps: [
                {
                    title: 'Change Tool',
                    description: () => (
                        <div>
                            Change over to the next tool ({getToolString()}),
                            and once secured prepare to check the length of the
                            new cutting tool.
                        </div>
                    ),
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
                                    'G53 G0 Z[global.toolchange.PROBE_POS_Z]',
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-15 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    '(Set Z to Tool offset and wait)',
                                    'G4 P0.3',
                                    `${modal} G10 L20 P0 Z[global.toolchange.TOOL_OFFSET]`,
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G53 G21 G0 Z[global.toolchange.Z_SAFE_HEIGHT]',
                                    'G21 G91',
                                ]);
                            },
                        },
                    ],
                },
            ],
        },
        {
            title: 'Resume Job',
            substeps: [
                {
                    title: 'Resume Job',
                    description:
                        'If everything looks good, prepare for your machine to move back to the cutting area and continue as expected. Turn on your router if you have one.',
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

export default wizard;
