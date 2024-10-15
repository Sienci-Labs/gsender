import React, { useContext } from 'react';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

import store from 'app/store';
import { WORKSPACE_MODE, GRBL } from 'app/constants';

import Button from 'app/components/Button';
import { MODALS } from './utils/constants';
import { runYAxisAlignmentProbing, runZAxisProbing } from './utils/probing';
import { RotaryContext } from './Context';
import { SET_ACTIVE_DIALOG } from './Context/actions';

const ActionArea = ({ actions, isDisabled }) => {
    const { dispatch } = useContext(RotaryContext);
    const { type: controllerType } = useSelector((store) =>
        get(store, 'controller'),
    );

    const showUnitSetup = () => {
        dispatch({
            type: SET_ACTIVE_DIALOG,
            payload: MODALS.PHYSICAL_UNIT_SETUP,
        });
    };

    const handleStockTurningClick = () => {
        dispatch({
            type: SET_ACTIVE_DIALOG,
            payload: MODALS.STOCK_TURNING,
            isDisabled: isDisabled,
        });
    };

    const isInRotaryMode =
        store.get('workspace.mode', WORKSPACE_MODE.DEFAULT) ===
        WORKSPACE_MODE.ROTARY;
    const isUsingGrbl = controllerType === GRBL;

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* <Button
                onClick={handleStockTurningClick}
                disabled={(isUsingGrbl && !isInRotaryMode) || isDisabled}
            >
                Rotary Surfacing
            </Button> */}
            <Button
                onClick={() => actions.runProbing('Z-axis', runZAxisProbing())}
                disabled={(isUsingGrbl && !isInRotaryMode) || isDisabled}
            >
                Probe Rotary Z-Axis
            </Button>
            <Button
                onClick={() =>
                    actions.runProbing(
                        'Y-axis alignment',
                        runYAxisAlignmentProbing(),
                    )
                }
                disabled={(isUsingGrbl && isInRotaryMode) || isDisabled}
            >
                Y-axis Alignment
            </Button>
            <Button
                onClick={showUnitSetup}
                disabled={(isUsingGrbl && isInRotaryMode) || isDisabled}
            >
                Rotary Mounting Setup
            </Button>
        </div>
    );
};

export default ActionArea;
