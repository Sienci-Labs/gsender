import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import {
    AXIS_E,
    AXIS_X,
    AXIS_Y,
    AXIS_Z,
    AXIS_A,
    AXIS_B,
    AXIS_C,
    METRIC_UNITS,
    WORKSPACE_MODE
} from 'app/constants';
import store from 'app/store';

import MachinePositionInput from 'app/widgets/Location/components/MachinePositionInput';
import GoToButton from '../Location/components/GoToButton';
import AxisButton from '../Location/components/AxisButton';
import PositionLabel from '../Location/components/PositionLabel';

const DROarea = ({ canClick = true, actions }) => {
    const units = store.get('workspace.units', METRIC_UNITS);

    const machinePosition = useSelector(state => state.controller.mpos);
    const workPosition = useSelector(state => state.controller.wpos);
    const { state: controllerState } = useSelector(state => state.controller);
    const [positionInput] = useState({
        [AXIS_E]: false,
        [AXIS_X]: false,
        [AXIS_Y]: false,
        [AXIS_Z]: false,
        [AXIS_A]: false,
        [AXIS_B]: false,
        [AXIS_C]: false
    });

    const renderAxis = (axis, label) => {
        const workspaceMode = store.get('workspace.mode', WORKSPACE_MODE.DEFAULT);
        const inRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;

        // Report the y value in the DRO since the A-axis is not reported back from the grbl controller we are simulating the rotary axis
        axis = axis === AXIS_A && inRotaryMode ? AXIS_Y : axis;

        let mpos = machinePosition[axis] || '0.000';
        const wpos = workPosition[axis] || '0.000';
        const axisLabel = axis.toUpperCase();
        const showPositionInput = canClick && positionInput[axis];

        //Function to zero out given axis
        const handleAxisButtonClick = () => {
            const wcs = controllerState.parserstate?.modal?.wcs || 'G54';

            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;

            controller.command('gcode', `G10 L20 P${p} ${axisLabel}0`);
        };

        const customMathRound = (num) => {
            num = String(num);
            const $13 = get(store, 'controller.settings.settings.$13');

            const DRO = store.get('workspace.customDecimalPlaces', 0);
            const places = $13 === '1' ? 4 : 3; // firmware gives back 3 for metric and 4 for imperial
            const defaultPlaces = $13 === '1' ? 3 : 2; // default places when DRO = 0
            const wholeLength = num.split('.')[0].length;

            let result = num.slice(0, wholeLength + 1 + places); // cut off the javascript weirdness
            if (DRO > places) { // add more 0s
                result = result.padEnd(wholeLength + 1 + DRO, '0'); // +1 for ., +DRO for decimal places
            } else { // remove decimal places (with rounding)
                result = Number(num).toFixed(DRO === 0 ? defaultPlaces : DRO);
            }
            return result;
        };

        return (
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <GoToButton
                        disabled={!canClick}
                        onClick={() => {
                            const commands = [];
                            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
                            commands.push(`G90 G0 ${axisLabel}0`); //Move to Work Position Zero
                            controller.command('gcode:safe', commands, modal);
                        }}
                    />
                    <AxisButton axis={label || axisLabel} onClick={handleAxisButtonClick} disabled={!canClick} />
                </div>
                <div>
                    <MachinePositionInput
                        value={customMathRound(wpos)}
                        disabled
                        handleManualMovement={(value) => actions.handleManualMovement(value, axis)}
                    />
                    {!showPositionInput && <PositionLabel value={customMathRound(mpos)} small />}
                </div>
            </div>
        );
    };

    return (
        <div>{renderAxis(AXIS_A, 'A')}</div>
    );
};

export default DROarea;
