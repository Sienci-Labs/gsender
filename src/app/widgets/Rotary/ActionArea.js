import React from 'react';
import controller from 'app/lib/controller';
import get from 'lodash/get';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { useSelector } from 'react-redux';
import FunctionButton from '../../components/FunctionButton/FunctionButton';

const ActionArea = ({ setPhysicalSetupState }) => {
    const controllerState = useSelector(store => get(store, 'controller.state'));
    const isFileRunning = () => {
        if (controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run') {
            return true;
        } else {
            return false;
        }
    };
    const actions = {
        runFullRotationTest: () => {
            Toaster.pop({
                msg: 'Running Rotary Full Rotation Test',
                type: TOASTER_INFO,
            });

            controller.command('gcode', ['G0 A0', 'G0 A360']);
        },
        showUnitSetup: () => {
            setPhysicalSetupState((prev) => ({ ...prev, showDialogue: true }));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FunctionButton onClick={actions.runFullRotationTest}>Full Rotation Test</FunctionButton>
            <FunctionButton>Stock Turning</FunctionButton>
            <FunctionButton onClick={actions.showUnitSetup} disabled={isFileRunning()}>Physical Rotary Unit Setup</FunctionButton>
            <FunctionButton>Y-axis Alignment Setup</FunctionButton>
            <FunctionButton>Z-axis Probing Setup</FunctionButton>
        </div>
    );
};

export default ActionArea;
