import api from 'app/api';

export const collectUserUsageData = async (toolName) => {
    try {
        await api.metrics.sendUsageData({ data: toolName });
    } catch (error) {
        console.log('Error accessing the Usage Endpoint');
        console.error(error);
    }
};
