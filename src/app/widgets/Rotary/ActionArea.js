import React, { useContext } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';
import store from 'app/store';
import { WORKSPACE_MODE } from 'app/constants';

// eslint-disable-next-line no-unused-vars
import { StockTurningGenerator } from './StockTurning/Generator';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import { MODALS, Y_AXIS_ALIGNMENT_PROBING_MACRO, Z_AXIS_PROBING_MACRO } from './utils/constants';
import { RotaryContext } from './Context';
import { SET_ACTIVE_DIALOG } from './Context/actions';

const ActionArea = ({ actions }) => {
    const { dispatch } = useContext(RotaryContext);
    const controllerState = useSelector(store => get(store, 'controller.state'));

    const showUnitSetup = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.PHYSICAL_UNIT_SETUP });
    };

    const handleStockTurningClick = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.STOCK_TURNING });
    };

    const isInRotaryMode = store.get('workspace.mode', WORKSPACE_MODE.DEFAULT) === WORKSPACE_MODE.ROTARY;
    const isFileRunning = controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run';

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FunctionButton onClick={handleStockTurningClick} disabled={!isInRotaryMode || isFileRunning}>Stock Turning</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Z-axis', Z_AXIS_PROBING_MACRO)} disabled={!isInRotaryMode || isFileRunning}>Probe Rotary Z-Axis</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Y-axis alignment', Y_AXIS_ALIGNMENT_PROBING_MACRO)} disabled={isInRotaryMode || isFileRunning}>Y-axis Alignment</FunctionButton>
            <FunctionButton onClick={showUnitSetup} disabled={isInRotaryMode || isFileRunning}>Rotary Mounting Setup</FunctionButton>
        </div>
    );
};

export default ActionArea;
