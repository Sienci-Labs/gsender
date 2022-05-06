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

import React from 'react';
import PropTypes from 'prop-types';
import AxisButton from 'app/widgets/Location/components/AxisButton';
import GoToButton from 'app/widgets/Location/components/GoToButton';
import MachinePositionInput from 'app/widgets/Location/components/MachinePositionInput';
import PositionLabel from 'app/widgets/Location/components/PositionLabel';
import style from './DROstyle.styl';

const DRO = ({ label = 'A', wpos = 0.000, mpos = 0.000, zeroHandler, gotoHandler, droHandler, canClick = false }) => {
    const disabled = !canClick;
    return (
        <div className={style.wrapper}>
            <label>{label}</label>
            <AxisButton onClick={zeroHandler} disabled={disabled} />
            <div className={style.positionWrapper}>
                <MachinePositionInput value={wpos} handleManualMovement={(value) => droHandler(value, label)} />
                <PositionLabel value={mpos} small />
            </div>

            <GoToButton disabled={disabled} onClick={gotoHandler} />
        </div>
    );
};

DRO.propTypes = {
    label: PropTypes.string,
    wpos: PropTypes.number,
    mpos: PropTypes.number,
    zeroHandler: PropTypes.func,
    gotoHandler: PropTypes.func,
    droHandler: PropTypes.func,
    canClick: PropTypes.bool
};

export default DRO;
