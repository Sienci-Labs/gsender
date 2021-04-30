/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import ToggleSwitch from '../../../components/ToggleSwitch';
import styles from '../index.styl';

import Input from '../Input';

const AddProbe = ({ state, actions }) => {
    const { probe } = state;
    const { functions } = probe;
    const probeActions = actions.probe;

    const { units } = state;

    const values = {
        xyThickness: units === 'mm' ? probe.xyThickness.mm : probe.xyThickness.in,
        zThickness: units === 'mm' ? probe.zThickness.mm : probe.zThickness.in
    };

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <span id="helpBlock" className="help-block">Supported probe axes for this specific touchplate</span>
                {
                    functions.z && (
                        <Input
                            label="Z Thickness"
                            units={units}
                            value={values.zThickness}
                            onChange={probeActions.changeZThickness}
                            additionalProps={{ type: 'number', id: 'zThickness' }}
                        />
                    )
                }
                <div className={styles.inputSpread}>
                    <label htmlFor="xProbe">XY Probe</label>
                    <ToggleSwitch
                        checked={functions.y}
                        onChange={() => {
                            probeActions.handleToggleChange('x', 'y');
                        }}
                    />
                </div>
            </div>

            {
                (functions.x && functions.y) && (
                    <Input
                        label="XY Thickness"
                        units={units}
                        value={values.xyThickness}
                        onChange={probeActions.changeXYThickness}
                        additionalProps={{ type: 'number', id: 'xyThickness' }}
                    />
                )
            }
        </div>
    );
};

export default AddProbe;
