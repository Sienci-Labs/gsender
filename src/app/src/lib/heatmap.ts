import api from '../api';
import { USER_DATA_COLLECTION } from '../constants';
import { USAGE_TOOL_NAME_T } from '../definitions/types';

export const collectUserUsageData = async (toolName: USAGE_TOOL_NAME_T) => {
    const res = await api.metrics.getCollectDataStatus();

    const collectUserDataStatus = res.data.collectUserDataStatus;

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
