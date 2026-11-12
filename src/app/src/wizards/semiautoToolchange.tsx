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
import { i18n } from 'app/i18n';
import { getProbeSettings, getToolString } from 'app/lib/toolChangeUtils';
import { store as reduxStore } from 'app/store/redux';
import get from 'lodash/get';
import type { WizardInstructions } from './definitions';

const getMoveAmount = () => {
    const $13 = get(
        reduxStore.getState(),
        'controller.settings.settings.$13',
        '0',
    );
    return $13 ? '0.4in' : '10mm';
};

// $132 is max z travel, if soft limits ($20) enabled we need to make sure probe distance will not exceed max limits
const calculateMaxZProbeDistance = (zProbeDistance = 30) => {
    const state = reduxStore.getState();
    const softLimits = Number(
        get(state, 'controller.settings.settings.$20', 0),
    );

    // Can safely use configured Z probe distance if soft limits not enabled
    if (softLimits === 0) {
        return zProbeDistance;
    }
    const maxZTravel = Number(get(state, 'controller.settings.settings.$132'));
    const curZPos = Math.abs(Number(get(state, 'controller.mpos.z')));

    // If we think we'll trigger a limit switch, we need to calculate the max value we actually can probe
    if (curZPos + zProbeDistance >= maxZTravel) {
        zProbeDistance = maxZTravel - curZPos - 1;
    }

    return zProbeDistance.toFixed(3);
};

const getProbeInitialToolStep = () => [
    {
        title: i18n.t('wizards:semiautoToolchange.setupProbe.title'),
        substeps: [
            {
                title: i18n.t('wizards:semiautoToolchange.checkOffset.title'),
                description: () =>
                    i18n.t(
                        'wizards:semiautoToolchange.checkOffset.description',
                        {
                            amount: getMoveAmount(),
                        },
                    ),
                overlay: false,
                actions: [
                    {
                        label: i18n.t('wizards:toolchange.probeInitialTool'),
                        gcodeLines: [
                            'G91 G21',
                            'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                            'G0 Z[global.toolchange.RETRACT]',
                            'G38.2 Z-15 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                            'G4 P0.3',
                            '%global.toolchange.TOOL_OFFSET=posz',
                            '(TLO set: [global.toolchange.TOOL_OFFSET])',
                            'G91 G21 G0 Z10',
                            'G90',
                        ],
                    },
                ],
            },
        ],
    },
];

const createWizard = (count: number): WizardInstructions => {
    return {
        intro: {
            icon: 'fas fa-caution',
            description: i18n.t('wizards:toolchange.intro'),
        },
        onStart: () => {
            const settings = getProbeSettings();

            const zProbeDistance = calculateMaxZProbeDistance(
                settings.zProbeDistance,
            );

            return [
                '%wait',
                `%global.toolchange.PROBE_THICKNESS=${settings.zProbeThickness}`,
                `%global.toolchange.PROBE_DISTANCE=${zProbeDistance}`,
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
                'M5',
                'G91 G21',
                '(Toolchange Initiated)',
            ];
        },
        steps: [
            {
                title: i18n.t('wizards:toolchange.startingOff'),
                substeps: [
                    {
                        title: i18n.t('wizards:toolchange.safetyFirst'),
                        description: () => (
                            <div>
                                {count === 1
                                    ? i18n.t(
                                          'wizards:semiautoToolchange.safetyFirst.descriptionProbeLocation',
                                      )
                                    : i18n.t(
                                          'wizards:semiautoToolchange.safetyFirst.descriptionToolChangeLocation',
                                      )}
                            </div>
                        ),
                        overlay: false,
                    },
                ],
            },
            ...(count === 1 ? getProbeInitialToolStep() : []),
            {
                title: i18n.t('wizards:toolchange.probeNewTool'),
                substeps: [
                    {
                        title: i18n.t('wizards:toolchange.changeTool'),
                        description: () => {
                            const values = {
                                tool: getToolString(),
                                amount: getMoveAmount(),
                            };

                            return (
                                <div>
                                    {count === 1
                                        ? i18n.t(
                                              'wizards:semiautoToolchange.changeTool.descriptionFirst',
                                              values,
                                          )
                                        : i18n.t(
                                              'wizards:semiautoToolchange.changeTool.description',
                                              values,
                                          )}
                                </div>
                            );
                        },
                        overlay: false,
                        toolBanner: true,
                        actions: [
                            {
                                label: i18n.t(
                                    'wizards:toolchange.probeChangedTool',
                                ),
                                gcodeLines: [
                                    'G91 G21',
                                    'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                    'G38.2 Z-15 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                    '(Set Z to Tool offset and wait)',
                                    'G4 P0.3',
                                    '[global.toolchange.UNITS] G10 L20 P0 Z[global.toolchange.TOOL_OFFSET]',
                                    'G0 Z[global.toolchange.RETRACT]',
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                title: i18n.t('wizards:toolchange.resumeJob'),
                substeps: [
                    {
                        title: i18n.t('wizards:toolchange.resumeJob'),
                        description: i18n.t(
                            'wizards:toolchange.resumeJobDescription',
                        ),
                        overlay: false,
                        actions: [
                            {
                                label: i18n.t(
                                    'wizards:toolchange.resumeCutting',
                                ),
                                gcodeLines: [
                                    '(Returning to initial position)',
                                    'G21 G91 G0 Z10',
                                    'G90 [global.toolchange.UNITS] G0 X[global.toolchange.XPOS] Y[global.toolchange.YPOS]',
                                    'G90 [global.toolchange.UNITS] G0 Z[global.toolchange.ZPOS]',
                                    '(Restore initial modals)',
                                    '[global.toolchange.SPINDLE] [global.toolchange.UNITS] [global.toolchange.DISTANCE] [global.toolchange.FEEDRATE]',
                                    '%toolchange_complete',
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
};

export default createWizard;
