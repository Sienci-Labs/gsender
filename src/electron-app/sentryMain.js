import * as Sentry from "@sentry/electron/main";
import fs from "fs";
import {
	getSentryEnvironment,
	getUsageDataConsentFromStore,
	isSentryRuntimeEnabled,
	SENTRY_DSN,
	scrubSentryEvent,
} from "../sentryShared.js";

let sentryInitialized = false;

export function initSentryMain({ release, userDataPath }) {
	if (sentryInitialized || !isSentryRuntimeEnabled()) {
		return;
	}

	Sentry.init({
		dsn: SENTRY_DSN,
		release,
		environment: getSentryEnvironment(release),
		beforeSend: scrubSentryEvent,
	});
	sentryInitialized = true;
}

export function closeSentryMain() {
	if (!sentryInitialized) {
		return;
	}
	Sentry.close();
	sentryInitialized = false;
}

export function setupSentryFromStore({ release, userDataPath }) {
	const consent = getUsageDataConsentFromStore(userDataPath, fs);
	if (consent === "accepted") {
		initSentryMain({ release, userDataPath });
	}
}

export function updateSentryMainConsent({ status, release, userDataPath }) {
	if (status === "accepted") {
		initSentryMain({ release, userDataPath });
		return;
	}
	closeSentryMain();
}
