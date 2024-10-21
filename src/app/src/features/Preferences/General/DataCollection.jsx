import React, { useEffect, useState } from 'react';

import ToggleSwitch from 'app/components/Switch';
import Tooltip from 'app/components/Tooltip';
import { USER_DATA_COLLECTION } from 'app/constants';
import api from 'app/api';

import Fieldset from '../components/Fieldset';

const useGetCollectDataStatus = () => {
    const [data, setData] = useState(USER_DATA_COLLECTION.INITIAL);

    const retrieveData = async () => {
        const res = await api.metrics.getCollectDataStatus();

        const collectUserDataStatus = res.body.collectUserDataStatus;

        setData(collectUserDataStatus);
    };

    useEffect(() => {
        retrieveData();
    }, []);

    return [data, setData];
};

const DataCollection = () => {
    const [collectUserData, setCollectUserData] = useGetCollectDataStatus();

    const handleCollectDataToggle = async (toggled) => {
        const status = toggled
            ? USER_DATA_COLLECTION.ACCEPTED
            : USER_DATA_COLLECTION.REJECTED;

        await api.metrics.toggleCollectDataStatus({
            collectUserDataStatus: status,
        });

        setCollectUserData(status);
    };

    return (
        <Fieldset legend="Data Collection">
            <div style={{ marginBottom: '10px' }}>
                <Tooltip
                    content="Allow gSender to collect your data periodically"
                    location="default"
                >
                    <ToggleSwitch
                        label="Send Usage Data"
                        checked={
                            collectUserData === USER_DATA_COLLECTION.ACCEPTED
                        }
                        onChange={handleCollectDataToggle}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default DataCollection;
