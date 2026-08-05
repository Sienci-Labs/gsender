import { toast as sonnerToast } from "sonner";

import { AccessoryConnectivityToast } from "./AccessoryConnectivityToast";

export function showAccessoryConnectivityToast(
	accessoryName: string,
	status: "connected" | "disconnected",
): void {
	sonnerToast.custom(
		(id) => (
			<AccessoryConnectivityToast
				status={status}
				accessoryName={accessoryName}
				onDismiss={() => sonnerToast.dismiss(id)}
			/>
		),
		{ position: "top-right" },
	);
}
