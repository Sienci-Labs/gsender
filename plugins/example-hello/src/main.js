import {
	gsender,
	subscribeSelector,
	subscribeWorkspaceState,
} from "@sienci/gsender-plugin-sdk";

import "./style.css";

const contextOutput = document.getElementById("context-output");
const fetchContextBtn = document.getElementById("fetch-context");
const workspaceUnits = document.getElementById("workspace-units");
const connectionStatus = document.getElementById("connection-status");

fetchContextBtn?.addEventListener("click", async () => {
	if (!contextOutput) {
		return;
	}

	contextOutput.textContent = "Loading…";
	try {
		const ctx = await gsender.machine.getContext();
		contextOutput.textContent = JSON.stringify(ctx, null, 2);
	} catch (err) {
		contextOutput.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
	}
});

subscribeWorkspaceState((workspace) => {
	if (!workspaceUnits) {
		return;
	}
	const units = workspace?.units ?? "unknown";
	workspaceUnits.textContent = String(units);
});

subscribeSelector(
	(state) => state.connection?.isConnected ?? false,
	(isConnected) => {
		if (!connectionStatus) {
			return;
		}
		connectionStatus.textContent = isConnected ? "Yes" : "No";
		connectionStatus.dataset.connected = isConnected ? "true" : "false";
	},
);
