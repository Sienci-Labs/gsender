import React, { useState } from 'react';

import ToggleSwitch from 'app/components/ToggleSwitch';

import SettingWrapper from '../components/SettingWrapper';
import Fieldset from '../components/Fieldset';
import GeneralArea from '../components/GeneralArea';
import TooltipCustom from '../../../components/TooltipCustom/ToolTip';
import Laser from './Laser';
import Spindle from './Spindle';

const SpindleLaser = ({ active, state, actions }) => {
    const [toggle, setToggle] = useState(false);

    const handleToggle = (val) => {
        setToggle(val);
    };

    const ActiveSection = toggle ? Laser : Spindle;

    return (
        <SettingWrapper title={toggle ? 'Laser' : 'Spindle'} show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Fieldset legend="Toggle">
                        <TooltipCustom content="Switch Between Laser and Spindle" location="default">
                            <ToggleSwitch
                                label="Spindle/Laser"
                                checked={toggle}
                                onChange={handleToggle}
                                style={{ marginBottom: '1rem' }}
                            />
                        </TooltipCustom>
                    </Fieldset>
                </GeneralArea.Half>

                <GeneralArea.Half>
                    <ActiveSection state={state} actions={actions} />
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default SpindleLaser;
