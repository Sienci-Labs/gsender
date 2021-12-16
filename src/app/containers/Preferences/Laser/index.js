import React from 'react';

import SettingWrapper from '../components/SettingWrapper';
import Fieldset from '../components/Fieldset';
import GeneralArea from '../components/GeneralArea';

const General = ({ active, state, actions }) => {
    return (
        <SettingWrapper title="Laser" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Fieldset legend="Axes Offset">
                        test
                    </Fieldset>
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default General;
