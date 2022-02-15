import React, { useState } from 'react';

import ToggleSwitch from 'app/components/ToggleSwitch';
import store from 'app/store';
import controller from 'app/lib/controller';

import SettingWrapper from '../components/SettingWrapper';
import Fieldset from '../components/Fieldset';
import GeneralArea from '../components/GeneralArea';
import TooltipCustom from '../../../components/TooltipCustom/ToolTip';
import Laser from './Laser';
import Spindle from './Spindle';

const SpindleLaser = ({ active, state, actions }) => {
    const [machineProfile, setMachineProfile] = useState(store.get('workspace.machineProfile', {}));

    const handleToggle = () => {
        const value = !machineProfile.spindle;
        const updatedObj = {
            ...machineProfile,
            spindle: value
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);

        setMachineProfile(updatedObj);
    };

    const { spindle } = machineProfile;

    return (
        <SettingWrapper title="Spindle/Laser" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Fieldset legend="Toggle">
                        <TooltipCustom content="Enable or Disable Spindle/Laser" location="default">
                            <ToggleSwitch
                                label="Spindle/Laser"
                                checked={spindle}
                                onChange={handleToggle}
                                style={{ marginBottom: '1rem' }}
                            />
                        </TooltipCustom>
                    </Fieldset>
                    <Spindle state={state} actions={actions} />
                </GeneralArea.Half>

                <GeneralArea.Half>
                    <Laser state={state} actions={actions} />
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default SpindleLaser;
