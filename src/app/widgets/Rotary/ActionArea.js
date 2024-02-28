import React, { useContext } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

import store from 'app/store';
import { WORKSPACE_MODE, GRBL } from 'app/constants';

import FunctionButton from '../../components/FunctionButton/FunctionButton';
import { MODALS } from './utils/constants';
import { runYAxisAlignmentProbing, runZAxisProbing } from './utils/probing';
import { RotaryContext } from './Context';
import { SET_ACTIVE_DIALOG } from './Context/actions';

const ActionArea = ({ actions }) => {
    const { dispatch } = useContext(RotaryContext);
    const { state: controllerState, type: controllerType } = useSelector(store => get(store, 'controller'));

    const showUnitSetup = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.PHYSICAL_UNIT_SETUP });
    };

    const handleStockTurningClick = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.STOCK_TURNING, isDisabled: isFileRunning });
    };

    const isInRotaryMode = store.get('workspace.mode', WORKSPACE_MODE.DEFAULT) === WORKSPACE_MODE.ROTARY;
    const isFileRunning = controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run';
    const isUsingGrbl = controllerType === GRBL;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
            <FunctionButton
                onClick={handleStockTurningClick}
                disabled={(isUsingGrbl && !isInRotaryMode) || isFileRunning}
            >
                Rotary Surfacing
            </FunctionButton>

            <FunctionButton
                onClick={() => actions.runProbing('Z-axis', runZAxisProbing())}
                disabled={(isUsingGrbl && !isInRotaryMode) || isFileRunning}
            >
                Probe Rotary Z-Axis
            </FunctionButton>

            <FunctionButton
                onClick={() => actions.runProbing('Y-axis alignment', runYAxisAlignmentProbing())}
                disabled={(isUsingGrbl && isInRotaryMode) || isFileRunning}
            >
                Y-axis Alignment
            </FunctionButton>

            <FunctionButton
                onClick={showUnitSetup}
                disabled={(isUsingGrbl && isInRotaryMode) || isFileRunning}
            >
                Rotary Mounting Setup
            </FunctionButton>
        </div>
    );
};

export default ActionArea;
