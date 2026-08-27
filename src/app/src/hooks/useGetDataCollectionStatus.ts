import api from "app/api";

import { USER_DATA_COLLECTION } from "app/constants";
import { useEffect, useState } from "react";

export type UserDataCollectionStatus =
	(typeof USER_DATA_COLLECTION)[keyof typeof USER_DATA_COLLECTION];

export const useGetCollectDataStatus = () => {
	const [data, setData] = useState<UserDataCollectionStatus>(
		USER_DATA_COLLECTION.INITIAL,
	);

	const retrieveData = async () => {
		const res = await api.metrics.getCollectDataStatus();

		const collectUserDataStatus = res.data.collectUserDataStatus;

		setData(collectUserDataStatus);
	};

	useEffect(() => {
		retrieveData();
	}, []);

	return [data, setData];
};
