import { collectUserUsageData } from "app/lib/heatmap";
import { useEffect } from "react";
import type { USAGE_TOOL_NAME } from "../constants";

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
