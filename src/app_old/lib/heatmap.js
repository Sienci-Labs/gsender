import api from 'app/api';
import { USER_DATA_COLLECTION } from 'app/constants';

export const collectUserUsageData = async (toolName) => {
    const res = await api.metrics.getCollectDataStatus();

    const collectUserDataStatus = res.body.collectUserDataStatus;

    if (collectUserDataStatus !== USER_DATA_COLLECTION.ACCEPTED) {
        return;
    }

    try {
        await api.metrics.sendUsageData({ data: toolName });
    } catch (error) {
        console.log('Error accessing the Usage Endpoint');
        console.error(error);
    }
};
