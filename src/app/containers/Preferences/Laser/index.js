import React from 'react';

import SettingWrapper from '../components/SettingWrapper';

// import GeneralArea from '../components/GeneralArea';

const General = ({ active, state, actions }) => {
    return (
        <SettingWrapper title="Laser" show={active}>
            {/* <GeneralArea>

                <GeneralArea.Half>
                </GeneralArea.Half>

                <GeneralArea.Half>
                </GeneralArea.Half>

            </GeneralArea> */}
        </SettingWrapper>
    );
};

export default General;
