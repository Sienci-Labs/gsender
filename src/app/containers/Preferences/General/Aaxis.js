import controller from 'app/lib/controller';
import React, { useState } from 'react';
import store from 'app/store';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';


const Aaxis = () => {
    const [aAxisStepPerMM, setAAxisStepPerMM] = useState(false);
    //TODO
    const handleRotaryAxisMMToggle = (addAAxisStepPerMM) => {
        let shouldEnableMM = !addAAxisStepPerMM;
        setAAxisStepPerMM(!addAAxisStepPerMM);
        console.log(addAAxisStepPerMM);
        // const diameter = 1; //TODO - fetch from input field
        //Max y movement = circumference(pi * d)
        // const ymax = 3.14 * diameter;
        if (shouldEnableMM) {
            //updatedYresolution or $101 = 9600/[ymax]
            // $101 = 9600/ymax;
            // //Y-axis Steps per mm adjusted for project
            // M0
            // G0 Y[ymax]
            // G4 P500
            // G0 Y0

            const mmMacro = 'macro content goes here'; //macro content

            //Run macro
            controller.command('aaxis:updateMM', mmMacro, shouldEnableMM);
            Toaster.clear();
            Toaster.pop({
                type: TOASTER_SUCCESS,
                msg: 'Y-Axis updated to match workpiece diameter'
            });
            return;
        }
        controller.command('aaxis:updateMM', null, shouldEnableMM);
        Toaster.clear();
        Toaster.pop({
            type: TOASTER_SUCCESS,
            msg: 'Workpiece diameter will be ignored from Y-Axis'
        });
    };

    return (
        <Fieldset legend="A Axis">
            <Tooltip content="When ON, Y-axis max will match the work piece circumference of stock diameter entered below" location="default">
                <ToggleSwitch
                    label="A-Axis Step Per MM"
                    checked={aAxisStepPerMM}
                    onChange={() => {
                        handleRotaryAxisMMToggle(aAxisStepPerMM);
                    }}
                    size="small"
                    style={{ marginBottom: '1rem' }}
                />
            </Tooltip>
            <Tooltip content="Set work piece diameter" location="default">
                <Input
                    label="Workpiece Diameter"
                    units={store.get('workspace.units')}
                    onChange={null}
                    additionalProps={{ type: 'number', disabled: !aAxisStepPerMM }}
                    value={0}
                />
            </Tooltip>
        </Fieldset>
    );
};

export default Aaxis;
