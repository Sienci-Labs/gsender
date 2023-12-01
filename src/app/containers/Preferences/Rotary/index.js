import React, { useEffect } from 'react';

import GeneralArea from '../components/GeneralArea';
import SettingWrapper from '../components/SettingWrapper';
import FirmwareConfig from './FirmwareConfig';
import DefaultFirmwareConfig from './DefaultFirmwareConfig';
import Toggle from './Toggle';
import { collectUserUsageData } from '../../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../../constants';

const Rotary = ({ active, state, actions }) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.ROTARY);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

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
