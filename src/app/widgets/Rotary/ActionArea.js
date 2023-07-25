import React, { useContext } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

// eslint-disable-next-line no-unused-vars
import { StockTurningGenerator } from './StockTurning/Generator';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import { MODALS, Y_AXIS_ALIGNMENT_PROBING_MACRO, Z_AXIS_PROBING_MACRO } from './utils/constants';
import { RotaryContext } from './Context';
import { SET_ACTIVE_DIALOG } from './Context/actions';

const ActionArea = ({ actions }) => {
    const { dispatch } = useContext(RotaryContext);
    const controllerState = useSelector(store => get(store, 'controller.state'));
    const isFileRunning = () => {
        if (controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run') {
            return true;
        } else {
            return false;
        }
    };

    const showUnitSetup = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.PHYSICAL_UNIT_SETUP });
    };

    const handleStockTurningClick = () => {
        dispatch({ type: SET_ACTIVE_DIALOG, payload: MODALS.STOCK_TURNING });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FunctionButton onClick={handleStockTurningClick}>Stock Turning</FunctionButton>
            <FunctionButton onClick={showUnitSetup} disabled={isFileRunning()}>Physical Rotary Unit Setup</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Y-axis alignment', Y_AXIS_ALIGNMENT_PROBING_MACRO)}>Y-axis Alignment Setup</FunctionButton>
            <FunctionButton onClick={() => actions.runProbing('Z-axis', Z_AXIS_PROBING_MACRO)}>Probe Rotary Z-Axis</FunctionButton>
        </div>
    );
};

export default ActionArea;
