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

    return (
        <div>
            <div className="flex gap-2 justify-center my-2">
                <Button
                    onClick={actions.sendLaserM3}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="fas fa-lightbulb" />
                    Laser On
                </Button>
                <Button
                    onClick={actions.runLaserTest}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="fas fa-satellite-dish" />
                    Laser Test
                </Button>
                <Button
                    onClick={actions.sendM5}
                    color={canClick ? 'primary' : 'disabled'}
                >
                    <i className="far fa-lightbulb" />
                    Laser Off
                </Button>
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
