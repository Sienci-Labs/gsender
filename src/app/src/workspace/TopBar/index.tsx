import SpindleLaserStatus from "app/components/SpindleLaserStatus";
import Connection from "app/features/Connection";
import { IconUpdater } from "app/features/IconUpdater";
import { RemoteMenuFlyout } from "app/features/RemoteMode/components/RemoteMenuFlyout.tsx";
import StatusIcons from "app/features/StatusIcons";
import store from "app/store";
import { useEffect } from "react";
import CenterArea from "./CenterArea";

interface Props {
	isRemoteWindow?: boolean;
}

export const TopBar = ({ isRemoteWindow }: Props) => {
	useEffect(() => {
		// sync gSender preferences from main window
		if (isRemoteWindow) {
			// wait a second for the initial store loading to be processed
			setTimeout(() => {
				store.syncPrefs();
			}, 500);
		}
	}, []);
	return (
		<div className="border p-3 h-14 max-xl:h-12 max-xl:p-2 box-border flex gap-4 max-sm:gap-2 items-center bg-gray-50 dark:bg-dark dark:border-gray-700">
			<RemoteMenuFlyout />

			<IconUpdater />

			<Connection />

			<CenterArea />

			<StatusIcons />

			<SpindleLaserStatus />
		</div>
	);
};
