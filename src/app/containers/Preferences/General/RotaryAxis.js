import controller from 'app/lib/controller';
import React, { useState } from 'react';
import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { Toaster, TOASTER_SUCCESS, TOASTER_WARNING } from 'app/lib/toaster/ToasterLib';
import get from 'lodash/get';
import reduxStore from 'app/store/redux';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';


const RotaryAxis = ({ state }) => {
    const [rotaryAxisStatus, setRotaryAxisStatus] = useState(store.get('rotaryAxisStatus', false));
    const { units } = state;
    //TODO
    const handleRotaryAxisToggle = () => {
        const firmwareType = get(reduxStore.getState(), 'controller.type', 'grbl');
        const isGrbl = firmwareType.toLocaleLowerCase() === 'grbl';
        const shouldEnableRotary = !rotaryAxisStatus;

        //If grbl, turn off Rotary Axis and update user
        if (isGrbl) {
            store.set('rotaryAxisStatus', false);
            Toaster.clear();
            Toaster.pop({
                type: TOASTER_WARNING,
                msg: 'Your firmware does not support Rotary Axis.',
            });
            return;
        }

        store.set('rotaryAxisStatus', shouldEnableRotary);
        setRotaryAxisStatus(shouldEnableRotary);
        //Fire event to toggle rotary axis on server
        controller.command('rotaryAxis:updateState', shouldEnableRotary);
        //Notify user
        const notification = shouldEnableRotary ? 'Rotary Axis turned on' : 'Rotary Axis is off';
        Toaster.clear();
        Toaster.pop({
            type: TOASTER_SUCCESS,
            msg: notification,
        });
    };

    return (
        <Fieldset legend="Rotary Axis">
            <Tooltip content="Turn Rotary Axis ON/OFF" location="default">
                <ToggleSwitch
                    label="Enable Rotary Axis"
                    checked={rotaryAxisStatus}
                    onChange={handleRotaryAxisToggle}
                    size="small"
                    style={{ marginBottom: '1rem' }}
                />
            </Tooltip>
            <Tooltip content="Enter work piece diameter" location="default">
                <Input
                    label="Stock Diameter"
                    units={units}
                    onChange={null}
                    additionalProps={{ type: 'number', disabled: !rotaryAxisStatus }}
                    value={0}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default RotaryAxis;
