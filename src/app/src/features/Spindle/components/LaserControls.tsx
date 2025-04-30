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

import Button from 'app/components/Button';
import Slider from './Slider';
import { Input } from 'app/components/Input';
import {
    FaLightbulb,
    FaRedoAlt,
    FaRegLightbulb,
    FaSatelliteDish,
} from 'react-icons/fa';
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
    handleLaserPowerChange: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
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
            <div className="flex gap-2 justify-center my-2">
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
            <Slider
                label="Power"
                unitString="%"
                value={laser.power}
                max={100}
                step={1}
                onChange={actions.handleLaserPowerChange}
            />
            <div className="flex gap-2 justify-center items-center my-2 dark:text-white">
                <label>Test Duration:</label>
                <div className="flex gap-2">
                    <Input
                        value={laser.duration}
                        onChange={actions.handleLaserDurationChange}
                        className="z-0 text-center text-blue-500 text-xl"
                        suffix="sec"
                    />
                </div>
            </div>
        </div>
    );
};

export default LaserControls;
