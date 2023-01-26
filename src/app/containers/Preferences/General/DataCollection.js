import React, { useState } from 'react';
import store from 'app/store';

import ToggleSwitch from 'app/components/ToggleSwitch';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { USER_DATA_COLLECTION } from 'app/constants';

import Fieldset from '../components/Fieldset';

const DataCollection = () => {
    const [collectUserData, setCollectUserData] = useState(store.get('workspace.collectUserData'));

    const handleCollectDataToggle = (toggled) => {
        const val = toggled ? USER_DATA_COLLECTION.ACCEPTED : USER_DATA_COLLECTION.REJECTED;

        setCollectUserData(val);

        store.replace('workspace.collectUserData', val);
    };

    return (
        <Fieldset legend="Data Collection">
            <div style={{ marginBottom: '10px' }}>
                <Tooltip content="Allow gSender to collect your data periodically" location="default">
                    <ToggleSwitch
                        label="Send Usage Data"
                        checked={collectUserData === USER_DATA_COLLECTION.ACCEPTED}
                        onChange={handleCollectDataToggle}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default DataCollection;
