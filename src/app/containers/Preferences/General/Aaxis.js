import controller from 'app/lib/controller';
import React, { useState } from 'react';
import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';


const Aaxis = () => {
    const [addAAxisStepPerMM, setAddAAxisStepPerMM] = useState(false);
    //TODO
    const handleRotaryAxisMMToggle = (addAAxisStepPerMM) => {
        setAddAAxisStepPerMM(!addAAxisStepPerMM);
        // const diameter = 1; //TODO
        //Max y movement = circumference(pi * d)
        // const ymax = 3.14 * diameter;
        if (addAAxisStepPerMM) {
            //updatedYresolution or $101 = 9600/[ymax]
            // $101 = 9600/ymax;
            // //Y-axis Steps per mm adjusted for project
            // M0
            // G0 Y[ymax]
            // G4 P500
            // G0 Y0

            const mmMacro = ''; //macro content

            //Run macro
            controller.command('macro:rotaryMMenable', mmMacro);
            return;
        }
        controller.command('macro:rotaryMMdisable');
    };
    return (
        <Fieldset legend="A Axis">
            <Tooltip content="When ON, Y-axis max will match the work piece circumference of stock diameter entered below" location="default">
                <ToggleSwitch
                    label="A-Axis Step Per MM"
                    checked={addAAxisStepPerMM}
                    onChange={() => handleRotaryAxisMMToggle(addAAxisStepPerMM)}
                    size="small"
                    style={{ marginBottom: '1rem' }}
                />
            </Tooltip>
            <Tooltip content="Set work piece diameter" location="default">
                <Input
                    label="Workpiece Diameter"
                    units={store.get('workspace.units')}
                    onChange={null}
                    additionalProps={{ type: 'number', disabled: !addAAxisStepPerMM }}
                    value={0}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default Aaxis;
