import { useEffect } from 'react';

import { USAGE_TOOL_NAME } from '../constants';
import { collectUserUsageData } from 'app/lib/heatmap';

type Feature = keyof typeof USAGE_TOOL_NAME;

export const useRecordFeatureData = (feature: Feature) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            collectUserUsageData(feature);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);
};
