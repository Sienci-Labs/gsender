import api from '../api';
import { USAGE_TOOL_NAME, USER_DATA_COLLECTION } from '../constants';

export const collectUserUsageData = async (
    toolName: keyof typeof USAGE_TOOL_NAME,
) => {
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
