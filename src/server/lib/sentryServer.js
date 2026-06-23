import * as Sentry from "@sentry/node";
import isElectron from "is-electron";
import pkg from "../../package.json";
import {
	getSentryEnvironment,
	getUsageDataConsentFromStore,
	resolveConsentStoreDirectory,
	SENTRY_DSN,
	scrubSentryEvent,
} from "../../sentryShared.js";

let sentryInitialized = false;

export function setupServerSentry() {
	if (process.env.NODE_ENV !== "production") {
		return false;
	}

	// In Electron, @sentry/electron/main in the main process owns initialization.
	if (isElectron()) {
		return Sentry.isInitialized();
	}

	if (sentryInitialized || Sentry.isInitialized()) {
		return true;
	}

	const userDataPath = resolveConsentStoreDirectory();
	const consent = getUsageDataConsentFromStore(userDataPath);
	if (consent !== "accepted") {
		return false;
	}

	const release = pkg.version;
	Sentry.init({
		dsn: SENTRY_DSN,
		release,
		environment: getSentryEnvironment(release),
		beforeSend: scrubSentryEvent,
	});
	sentryInitialized = true;
	return true;
}

export function setupExpressSentryHandler(app) {
	if (!Sentry.isInitialized()) {
		return;
	}

	Sentry.setupExpressErrorHandler(app);
}

export function captureServerException(error, context) {
	if (!Sentry.isInitialized()) {
		return;
	}

	Sentry.captureException(error, context);
}
