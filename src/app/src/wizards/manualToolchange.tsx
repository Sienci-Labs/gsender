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
import type { WizardInstructions } from './definitions';

const createWizard = (): WizardInstructions => ({
    intro: {
        icon: 'fas fa-caution',
        description: i18n.t('wizards:toolchange.intro'),
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
            'M5',
            'G91 G21',
            '(Toolchange initiated)',
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
                            {i18n.t(
                                'wizards:manualToolchange.safetyFirst.description',
                            )}
                        </div>
                    ),
                    overlay: false,
                },
                {
                    title: i18n.t('wizards:manualToolchange.changeBit.title'),
                    description: () =>
                        i18n.t(
                            'wizards:manualToolchange.changeBit.description',
                            {
                                tool: getToolString(),
                            },
                        ),
                    overlay: false,
                    toolBanner: true,
                },
            ],
        },
        {
            title: i18n.t('wizards:toolchange.probeNewTool'),
            substeps: [
                {
                    title: i18n.t('wizards:manualToolchange.resetZ.title'),
                    description: i18n.t(
                        'wizards:manualToolchange.resetZ.description',
                    ),
                    overlay: false,
                    actions: [
                        {
                            label: i18n.t(
                                'wizards:manualToolchange.resetZ.probeZ',
                            ),
                            gcodeLines: [
                                '(Probing Z 0 with probe thickness of [global.toolchange.PROBE_THICKNESS]mm)',
                                'G91',
                                'G38.2 Z-[global.toolchange.PROBE_DISTANCE] F[global.toolchange.PROBE_FEEDRATE]',
                                'G0 Z[global.toolchange.RETRACT]',
                                'G38.2 Z-10 F[global.toolchange.PROBE_SLOW_FEEDRATE]',
                                '%wait',
                                'G10 L20 P0 Z[global.toolchange.PROBE_THICKNESS]',
                                'G0 G21 Z10',
                            ],
                        },
                        {
                            label: i18n.t(
                                'wizards:manualToolchange.resetZ.setZ0',
                            ),
                            gcodeLines: [
                                '(Setting Z 0)',
                                'G10 L20 P0 Z0',
                                'G21',
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
                            label: i18n.t('wizards:toolchange.resumeJob'),
                            gcodeLines: [
                                '(Returning to initial position)',
                                'G21',
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
});

export default createWizard;
