import React, { useState } from 'react';
import { useSelector } from 'react-redux';

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
    const { type: controllerType, state: controllerState } = useSelector(state => state.controller);
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
        const inRotaryModeAndIsGrbl = workspaceMode === WORKSPACE_MODE.ROTARY && controllerType === 'Grbl';

        // Report the y value in the DRO since the A-axis is not reported back from the grbl controller we are simulating the rotary axis
        axis = axis === AXIS_A && inRotaryModeAndIsGrbl ? AXIS_Y : axis;

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
            // let radix = num % 1.0;
            // if ((radix > 0.899 && radix < 1.0) && (Number(num.split('.')[1].slice(0, 2)) > 97)) {
            //     return Math.ceil(num).toFixed(2);
            // } else {
            //     return num;
            // }
            return Number(num).toFixed(2);
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
                        disabled={!canClick}
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
