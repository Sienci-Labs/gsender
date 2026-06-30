import { VISUALIZER_SECONDARY } from "app/constants";
import controller from "app/lib/controller";
import { uploadGcodeFileToServer } from "app/lib/fileupload";
import store from "app/store";
import reduxStore from "app/store/redux";
import pubsub from "pubsub-js";
import type {
	PLUGIN_BRIDGE_CHANNEL,
	PluginBridgeRequest,
	PluginBridgeResponse,
} from "../types";

const BRIDGE_CHANNEL: typeof PLUGIN_BRIDGE_CHANNEL = "gsender:plugin-bridge";

const getMachineContext = () => {
	const units = store.get("workspace.units", "mm");
	const machineProfile = store.get("workspace.machineProfile", {});
	const controllerState = reduxStore.getState().controller;
	const connectionState = reduxStore.getState().connection;

	return {
		units,
		machineProfile,
		connected: connectionState.isConnected,
		port: controller.port,
		position: controllerState?.state?.status?.mpos || null,
		workPosition: controllerState?.state?.status?.wpos || null,
	};
};

const loadGcodePreview = async (payload: Record<string, unknown> = {}) => {
	const gcode = String(payload.gcode || "");
	const filename = String(payload.filename || "plugin-preview.gcode");

	if (!gcode) {
		throw new Error("gcode is required");
	}

	const file = new File([gcode], filename);
	await uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);

	return { filename };
};

const commitGcodeToJob = async (payload: Record<string, unknown> = {}) => {
	const gcode = String(payload.gcode || "");
	const filename = String(payload.filename || "plugin-job.gcode");

	if (!gcode) {
		throw new Error("gcode is required");
	}

	const size = new Blob([gcode]).size;
	pubsub.publish("gcode:plugin-commit", { gcode, name: filename, size });

	return { filename };
};

const runMachineCommand = async (payload: Record<string, unknown> = {}) => {
	const cmd = String(payload.cmd || "");
	const args = Array.isArray(payload.args) ? payload.args : [];

	if (!cmd) {
		throw new Error("cmd is required");
	}

	return new Promise((resolve, reject) => {
		controller.command(cmd, ...args, (err: Error | null, data: unknown) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
};

const handleBridgeRequest = async (
	request: PluginBridgeRequest,
): Promise<unknown> => {
	switch (request.type) {
		case "machine.getContext":
			return getMachineContext();
		case "cam.loadPreview":
			return loadGcodePreview(request.payload);
		case "cam.commitToJob":
			return commitGcodeToJob(request.payload);
		case "machine.command":
			return runMachineCommand(request.payload);
		default:
			throw new Error(`Unknown bridge request: ${request.type}`);
	}
};

export const handlePluginBridgeMessage = async (
	event: MessageEvent,
): Promise<PluginBridgeResponse | null> => {
	if (event.data?.channel !== BRIDGE_CHANNEL || !event.data?.request) {
		return null;
	}

	const request = event.data.request as PluginBridgeRequest;

	try {
		const result = await handleBridgeRequest(request);
		return {
			id: request.id,
			ok: true,
			result,
		};
	} catch (err) {
		return {
			id: request.id,
			ok: false,
			error: err instanceof Error ? err.message : "Bridge request failed",
		};
	}
};

export const installPluginBridgeListener = () => {
	const listener = async (event: MessageEvent) => {
		const response = await handlePluginBridgeMessage(event);

		if (
			!response ||
			!event.source ||
			typeof event.source.postMessage !== "function"
		) {
			return;
		}

		event.source.postMessage(
			{
				channel: BRIDGE_CHANNEL,
				response,
			},
			{ targetOrigin: event.origin },
		);
	};

	window.addEventListener("message", listener);

	return () => {
		window.removeEventListener("message", listener);
	};
};
