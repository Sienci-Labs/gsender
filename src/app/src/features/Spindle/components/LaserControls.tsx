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

import { Slider } from 'app/components/shadcn/Slider';
import { ControlledInput } from 'app/components/ControlledInput';
import { FaLightbulb, FaRegLightbulb, FaSatelliteDish } from 'react-icons/fa';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { ActiveStateButton } from 'app/components/ActiveStateButton';

type Props = {
    actions: LaserActions;
    state: {
        laser: LaserState;
    };
    canClick: boolean;
};

interface LaserState {
    power: number;
    duration: number;
}

interface LaserActions {
    sendLaserM3: () => void;
    runLaserTest: () => void;
    sendM5: () => void;
    handleLaserPowerChange: (value: number) => void;
    handleLaserDurationChange: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
}

const LaserControls = ({ actions, state, canClick }: Props) => {
    const { laser } = state;
    const { spindle } = useTypedSelector((state) => state.controller.modal);

    const laserIsOn = spindle !== 'M5';

    return (
        <div>
            <div className="flex justify-center mt-2">
                <ActiveStateButton
                    onClick={actions.sendLaserM3}
                    icon={<FaLightbulb />}
                    text="Laser On"
                    active={laserIsOn}
                    size={'sm'}
                    disabled={!canClick}
                />
                <ActiveStateButton
                    onClick={actions.runLaserTest}
                    icon={<FaSatelliteDish />}
                    text="Laser Test"
                    size={'sm'}
                    disabled={!canClick}
                />
                <ActiveStateButton
                    onClick={actions.sendM5}
                    icon={<FaRegLightbulb />}
                    text="Laser Off"
                    size={'sm'}
                    disabled={!canClick}
                />
            </div>
            <div className="grid grid-cols-[1fr_3fr_1fr] gap-2 justify-center mt-2 items-center dark:text-white">
                <span className="text-right">Power</span>
                <Slider
                    value={[laser.power]}
                    max={100}
                    step={1}
                    onValueChange={(value) =>
                        actions.handleLaserPowerChange(value[0])
                    }
                    disabled={!canClick}
                />
                <span>{laser.power}%</span>
            </div>
            <div className="flex gap-2 justify-center items-center mt-1 dark:text-white">
                <label>Test Duration:</label>
                <div className="flex gap-2">
                    <ControlledInput
                        value={laser.duration}
                        onChange={actions.handleLaserDurationChange}
                        className="z-0 text-center text-blue-500 text-xl"
                        suffix="sec"
                        type="number"
                    />
                </div>
            </div>
        </div>
    );
};

export default LaserControls;
