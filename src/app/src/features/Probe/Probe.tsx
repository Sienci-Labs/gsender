/*
 * Copyright (C) 2021 Sienci Labs Inc.
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

import React from 'react';
import cx from 'classnames';

import { Button as ShadcnButton } from 'app/components/shadcn/Button';
import { Button } from 'app/components/Button';

import { METRIC_UNITS } from '../../constants';
import ProbeImage from './ProbeImage';
import ProbeDiameter from './ProbeDiameter';
import ProbeDirectionSelection from './ProbeDirectionSelection';
import { Actions, State } from './definitions';
import { useRegisterShortcuts } from '../Keyboard/useRegisterShortcuts';
interface ProbeProps {
    state: State;
    actions: Actions;
}

const Probe: React.FC<ProbeProps> = ({ state, actions }) => {
    useRegisterShortcuts([
        {
            id: 'open-probe',
            title: 'Open Probe',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
            onKeyDown: () => {
                actions.onOpenChange(true);
            },
        },
        {
            id: 'close-probe',
            title: 'Close Probe',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
        },
        {
            id: 'probe-routine-scroll-right',
            title: 'Probe Routine Scroll Right',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
            onKeyDown: () => {
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand + 1;
                if (availableProbeCommands.length <= newIndex) {
                    newIndex = 0;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        {
            id: 'probe-routine-scroll-left',
            title: 'Probe Routine Scroll Left',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
            onKeyDown: () => {
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand - 1;
                if (newIndex < 0) {
                    newIndex = availableProbeCommands.length - 1;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        {
            id: 'probe-diameter-scroll-up',
            title: 'Probe Diameter Scroll Up',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
            onKeyDown: () => {
                const { toolDiameter, availableTools, units } = state;
                const toolUnits =
                    units === METRIC_UNITS
                        ? 'metricDiameter'
                        : 'imperialDiameter';
                const currIndex = availableTools.findIndex(
                    (element) => element[toolUnits] === toolDiameter,
                );

                let newIndex = currIndex - 1;
                if (newIndex < 0) {
                    newIndex = availableTools.length - 1;
                }
                actions._setToolDiameter({
                    value: availableTools[newIndex][`${toolUnits}`],
                });
            },
        },
        {
            id: 'probe-diameter-scroll-down',
            title: 'Probe Diameter Scroll Down',
            defaultKeys: '',
            category: 'PROBING_CATEGORY',
            onKeyDown: () => {
                const { toolDiameter, availableTools, units } = state;
                const toolUnits =
                    units === METRIC_UNITS
                        ? 'metricDiameter'
                        : 'imperialDiameter';
                const currIndex = availableTools.findIndex(
                    (element) => element[toolUnits] === toolDiameter,
                );

                let newIndex = currIndex + 1;
                if (newIndex >= availableTools.length) {
                    newIndex = 0;
                }
                actions._setToolDiameter({
                    value: availableTools[newIndex][`${toolUnits}`],
                });
            },
        },
    ]);

    const {
        canClick,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        direction,
    } = state;

    const { touchplateType } = touchplate;
    const probeCommand = availableProbeCommands[selectedProbeCommand];

    return (
        <div className="w-full h-full">
            <div className="grid grid-cols-[5fr_3fr] w-full h-full">
                {/* <div className="w-full h-full m-auto grid gap-4">
                    <div className="h-full grid grid-rows[4fr_2fr] self-center gap-2"> */}
                <div className="grid grid-rows-[1fr_1fr_1fr] gap-2 items-center justify-center">
                    <div className="flex w-full bg-white rounded-md border-solid border border-gray-300 p-[2px]">
                        {availableProbeCommands.map((command, index) => (
                            <ShadcnButton
                                key={command.id}
                                onClick={() =>
                                    actions.handleProbeCommandChange(index)
                                }
                                size="icon"
                                className={cx(
                                    'rounded-md relative h-[calc(4vh+3px)]',
                                    {
                                        'bg-blue-400 bg-opacity-30':
                                            index === selectedProbeCommand,
                                    },
                                )}
                            >
                                {command.id.split(' ')[0]}
                            </ShadcnButton>
                        ))}
                    </div>
                    <div
                        className={cx('flex items-center', {
                            hidden: !probeCommand?.tool,
                        })}
                    >
                        <ProbeDiameter
                            actions={actions}
                            state={state}
                            probeCommand={probeCommand}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <Button
                            onClick={() => actions.onOpenChange(true)}
                            disabled={!canClick}
                        >
                            Probe
                        </Button>
                    </div>
                </div>
                <div className="flex w-full h-full min-h-full">
                    <ProbeImage
                        touchplateType={touchplateType}
                        probeCommand={probeCommand}
                    />
                </div>
            </div>
            <ProbeDirectionSelection
                direction={direction}
                onClick={actions.nextProbeDirection}
            />
        </div>
    );
};

export default Probe;
