import { init as electronInit } from "@sentry/electron/renderer";
import {
	close,
	init as reactInit,
	reactRouterV7BrowserTracingIntegration,
} from "@sentry/react";
import isElectron from "is-electron";
import { useEffect } from "react";
import {
	createRoutesFromChildren,
	matchRoutes,
	useLocation,
	useNavigationType,
} from "react-router";
import {
	getSentryEnvironment,
	SENTRY_DSN,
	scrubSentryEvent,
} from "../../../sentryShared.js";
import pkg from "../../package.json";

export type UsageDataConsent = "accepted" | "denied" | "pending";

let initialized = false;

function getInitOptions() {
	return {
		sendDefaultPii: false,
		integrations: [
			reactRouterV7BrowserTracingIntegration({
				useEffect,
				useLocation,
				useNavigationType,
				createRoutesFromChildren,
				matchRoutes,
			}),
		],
		beforeSend: scrubSentryEvent,
	};
}

async function syncElectronMainConsent() {
	try {
		await window.ipcRenderer.invoke("sentry-consent", "accepted");
	} catch (error) {
		console.error("Failed to sync Sentry consent with main process:", error);
	}
}

async function initSentryRenderer() {
	if (!import.meta.env.PROD || initialized) {
		return;
	}

	const release = pkg.version;
	const environment = getSentryEnvironment(release);
	const initOptions = getInitOptions();

	try {
		if (isElectron()) {
			await syncElectronMainConsent();
			electronInit(initOptions, reactInit);
		} else {
			reactInit({
				...initOptions,
				dsn: SENTRY_DSN,
				release,
				environment,
			});
		}
		initialized = true;
	} catch (error) {
		console.error("Failed to initialize Sentry:", error);
	}
}

async function closeSentryRenderer() {
	if (!initialized) {
		return;
	}

	try {
		if (isElectron()) {
			await window.ipcRenderer.invoke("sentry-consent", "denied");
		}
		await close();
	} catch (error) {
		console.error("Failed to close Sentry:", error);
	} finally {
		initialized = false;
	}
}

export function updateSentryConsent(status: UsageDataConsent): void {
	if (!import.meta.env.PROD) {
		return;
	}

	if (status === "accepted") {
		void initSentryRenderer();
		return;
	}

	void closeSentryRenderer();
}
