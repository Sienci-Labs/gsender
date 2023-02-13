import React from 'react';

import controller from 'app/lib/controller';

import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import FunctionButton from '../../components/FunctionButton/FunctionButton';

const ActionArea = () => {
    const runFullRotationTest = () => {
        Toaster.pop({
            msg: 'Running Rotary Full Rotation Test',
            type: TOASTER_INFO,
        });

        controller.command('gcode', ['G0 A0', 'G0 A360']);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FunctionButton onClick={runFullRotationTest}>Full Rotation Test</FunctionButton>
            <FunctionButton>Stock Turning</FunctionButton>
            <FunctionButton>Physical Rotary Unit Setup</FunctionButton>
            <FunctionButton>Y-axis Alignment Setup</FunctionButton>
            <FunctionButton>Z-axis Probing Setup</FunctionButton>
        </div>
    );
};

export default ActionArea;
