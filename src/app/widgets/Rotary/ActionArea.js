import React, { useContext } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

import store from 'app/store';
import { WORKSPACE_MODE } from 'app/constants';

import FunctionButton from '../../components/FunctionButton/FunctionButton';
import { MODALS } from './utils/constants';
import { runYAxisAlignmentProbing, runZAxisProbing } from './utils/probing';
import { RotaryContext } from './Context';
import { SET_ACTIVE_DIALOG } from './Context/actions';

const ActionArea = ({ actions }) => {
    const { dispatch } = useContext(RotaryContext);
    const controllerState = useSelector(store => get(store, 'controller.state'));

    const showUnitSetup = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.PHYSICAL_UNIT_SETUP });
    };

    const handleStockTurningClick = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.STOCK_TURNING, isDisabled: isFileRunning });
    };

    const isInRotaryMode = store.get('workspace.mode', WORKSPACE_MODE.DEFAULT) === WORKSPACE_MODE.ROTARY;
    const isFileRunning = controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
            <FunctionButton onClick={handleStockTurningClick} disabled={!isInRotaryMode}>Rotary Surfacing</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Z-axis', runZAxisProbing())} disabled={!isInRotaryMode || isFileRunning}>Probe Rotary Z-Axis</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Y-axis alignment', runYAxisAlignmentProbing())} disabled={isInRotaryMode || isFileRunning}>Y-axis Alignment</FunctionButton>
            <FunctionButton onClick={showUnitSetup} disabled={isInRotaryMode || isFileRunning}>Rotary Mounting Setup</FunctionButton>
        </div>
    );
};

export default ActionArea;
