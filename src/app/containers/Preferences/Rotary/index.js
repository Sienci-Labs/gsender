import React from 'react';

import GeneralArea from '../components/GeneralArea';
import SettingWrapper from '../components/SettingWrapper';
import FirmwareConfig from './FirmwareConfig';
import DefaultFirmwareConfig from './DefaultFirmwareConfig';
import Toggle from './Toggle';

const Rotary = ({ active, state, actions }) => {
    return (
        <SettingWrapper title="Rotary" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Toggle state={state} actions={actions} />
                </GeneralArea.Half>
                <GeneralArea.Half>
                    <FirmwareConfig state={state} actions={actions} />
                    <DefaultFirmwareConfig state={state} actions={actions} />
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default Rotary;
