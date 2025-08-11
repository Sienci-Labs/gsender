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

import { Slider } from 'app/components/shadcn/Slider';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { FaBan, FaRedoAlt, FaUndoAlt } from 'react-icons/fa';
import { ActiveStateButton } from 'app/components/ActiveStateButton';

type Props = {
    actions: {
        sendM3: () => void;
        sendM4: () => void;
        sendM5: () => void;
        handleSpindleSpeedChange: (value: number) => void;
    };
    state: {
        spindleSpeed: number;
        spindleMin: number;
        spindleMax: number;
    };
    canClick: boolean;
};

const SpindleControls = ({ actions, state, canClick }: Props) => {
    const { spindle } = useTypedSelector((state) => state.controller.modal);

    const spindleForward = spindle === 'M3';
    const spindleReverse = spindle === 'M4';

    return (
        <>
            <div className="flex flex-row gap-2 justify-center my-2">
                <ActiveStateButton
                    onClick={actions.sendM3}
                    disabled={!canClick}
                    icon={<FaRedoAlt />}
                    text="Forward"
                    size="sm"
                    className="w-full"
                    active={spindleForward}
                />
                <ActiveStateButton
                    onClick={actions.sendM4}
                    disabled={!canClick}
                    icon={<FaUndoAlt />}
                    text="Reverse"
                    size="sm"
                    className="w-full"
                    active={spindleReverse}
                />
                <ActiveStateButton
                    onClick={actions.sendM5}
                    disabled={!canClick}
                    icon={<FaBan />}
                    text="Stop"
                    size="sm"
                    className="w-full"
                />
            </div>
            <div className="grid grid-cols-[1fr_3fr_1fr] gap-2 justify-center my-2 items-center dark:text-white">
                <span className="text-right">Speed</span>
                <Slider
                    value={[state.spindleSpeed]}
                    min={state.spindleMin}
                    max={state.spindleMax}
                    step={10}
                    className="w-3/5"
                    onValueChange={(value) =>
                        actions.handleSpindleSpeedChange(value[0])
                    }
                    disabled={!canClick}
                />
                <div className={'w-[10ch] text-left flex flex-row'}>
                    {state.spindleSpeed} RPM
                </div>
            </div>
        </>
    );
};

export default SpindleControls;
