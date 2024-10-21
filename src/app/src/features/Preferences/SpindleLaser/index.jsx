import React, { useEffect, useState } from 'react';

import ToggleSwitch from 'app/components/Switch';
import store from 'app/store';
import controller from 'app/lib/controller';

import SettingWrapper from '../components/SettingWrapper';
import Fieldset from '../components/Fieldset';
import Input from '../components/Input';
import GeneralArea from '../components/GeneralArea';
import { Tooltip as TooltipCustom } from 'app/components/ToolTip';
import Laser from './Laser';
import Spindle from './Spindle';
import { collectUserUsageData } from '../../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../../constants';

const SpindleLaser = ({ active, state, actions }) => {
    const { spindle } = state;
    const spindleActions = actions.spindle;
    const [delay, setDelay] = useState(spindle.delay);
    const [machineProfile, setMachineProfile] = useState(
        store.get('workspace.machineProfile', {}),
    );

    useEffect(() => {
        setDelay(spindle.delay);
    }, [spindle]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.SPINDLE_LASER);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    const handleToggle = () => {
        const value = !machineProfile.spindle;
        const laserOn = machineProfile.laserOnOutline;
        const updatedObj = {
            ...machineProfile,
            spindle: value,
            laserOnOutline: value === false ? false : laserOn,
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);

        setMachineProfile(updatedObj);
    };

    const handleONToggle = () => {
        const value = !machineProfile.laserOnOutline
            ? !machineProfile.laserOnOutline
            : false;
        const updatedObj = {
            ...machineProfile,
            laserOnOutline: value,
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);

        setMachineProfile(updatedObj);
    };

    const { spindle: isSpindle, laserOnOutline } = machineProfile;

    return (
        <SettingWrapper title="Spindle/Laser" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Fieldset legend="Toggle">
                        <TooltipCustom
                            content="Enable or Disable Spindle/Laser"
                            location="default"
                        >
                            <ToggleSwitch
                                label="Spindle/Laser"
                                checked={isSpindle}
                                onChange={handleToggle}
                                style={{ marginBottom: '1rem' }}
                            />
                        </TooltipCustom>
                        <TooltipCustom
                            content="Enable or Disable Laser ON during Outline"
                            location="default"
                        >
                            <ToggleSwitch
                                label="Laser ON during Outline"
                                disabled={!isSpindle}
                                checked={laserOnOutline}
                                onChange={handleONToggle}
                                style={{ marginBottom: '1rem' }}
                            />
                        </TooltipCustom>
                        <TooltipCustom
                            content="Add delay after spindle. Please reload your file after changing"
                            location="default"
                        >
                            <Input
                                label="Delay After Start"
                                units="s"
                                value={delay}
                                additionalProps={{ type: 'number', min: 0 }}
                                hasRounding={false}
                                onChange={(e) =>
                                    spindleActions.handleDelayChange(
                                        e.target.value,
                                    )
                                }
                            />
                            <p style={{ fontSize: '0.9rem', color: '#737373' }}>
                                Please reload your file after changing delay.
                            </p>
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
