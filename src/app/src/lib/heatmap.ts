import api from '../api';
import { USAGE_TOOL_NAME, USER_DATA_COLLECTION } from '../constants';

type USAGE_TOOL_NAME_T = (typeof USAGE_TOOL_NAME)[keyof typeof USAGE_TOOL_NAME];

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
