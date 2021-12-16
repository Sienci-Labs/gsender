import React from 'react';

import SettingWrapper from '../components/SettingWrapper';
import Fieldset from '../components/Fieldset';
import GeneralArea from '../components/GeneralArea';
import Input from '../components/Input';

const General = ({ active, state, actions }) => {
    const { units, laser } = state;
    console.log(laser);
    const { xOffset, yOffset } = laser;

    const laserActions = actions.laser;
    return (
        <SettingWrapper title="Laser" show={active}>
            <GeneralArea>
                <GeneralArea.Half>
                    <Fieldset legend="Axes Offset">
                        <Input
                            label="X Axis Offset"
                            units={units}
                            value={xOffset}
                            onChange={(e) => laserActions.handleOffsetChange(e, 'X')}
                        />
                        <Input
                            label="Y Axis Offset"
                            units={units}
                            value={yOffset}
                            onChange={(e) => laserActions.handleOffsetChange(e, 'Y')}
                        />
                    </Fieldset>
                </GeneralArea.Half>
            </GeneralArea>
        </SettingWrapper>
    );
};

export default General;
