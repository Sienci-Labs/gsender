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

import Button from 'app/components/Button';
import { Slider } from 'app/components/shadcn/Slider';

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
    return (
        <>
            <div className="flex flex-row gap-2 justify-center my-2">
                <Button
                    onClick={actions.sendM3}
                    disabled={!canClick}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="fas fa-redo-alt" />
                    For (M3)
                </Button>
                <Button
                    onClick={actions.sendM4}
                    disabled={!canClick}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="fas fa-redo-alt fa-flip-horizontal" />
                    Rev (M4)
                </Button>
                <Button
                    onClick={actions.sendM5}
                    disabled={!canClick}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="fas fa-ban" />
                    Stop (M5)
                </Button>
            </div>
            <div className="flex flex-row gap-2 justify-center my-2 items-center dark:text-white">
                <span>Speed</span>
                <Slider
                    value={[state.spindleSpeed]}
                    min={state.spindleMin}
                    max={state.spindleMax}
                    step={10}
                    onValueChange={(value) =>
                        actions.handleSpindleSpeedChange(value[0])
                    }
                    disabled={!canClick}
                />
                <span>{state.spindleSpeed} RPM</span>
            </div>
        </>
    );
};

export default SpindleControls;
