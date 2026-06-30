import * as SentryElectron from "@sentry/electron/main";
import * as SentryNode from "@sentry/node";
import isElectron from "is-electron";
import pkg from "../../package.json";
import {
	getSentryEnvironment,
	getUsageDataConsentFromStore,
	isSentryRuntimeEnabled,
	resolveConsentStoreDirectory,
	SENTRY_DSN,
	scrubSentryEvent,
} from "../../sentryShared.js";

let sentryInitialized = false;

function getActiveSentry() {
	return isElectron() ? SentryElectron : SentryNode;
}

export function setupServerSentry() {
	if (!isSentryRuntimeEnabled()) {
		return false;
	}

	const Sentry = getActiveSentry();

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
	SentryNode.init({
		dsn: SENTRY_DSN,
		release,
		environment: getSentryEnvironment(release),
		beforeSend: scrubSentryEvent,
	});
	sentryInitialized = true;
	return true;
}

export function setupExpressSentryHandler(app) {
	const Sentry = getActiveSentry();
	if (!Sentry.isInitialized()) {
		return;
	}

	Sentry.setupExpressErrorHandler(app);
}

export function captureServerException(error, context) {
	const Sentry = getActiveSentry();
	if (!Sentry.isInitialized()) {
		return;
	}

	Sentry.captureException(error, context);
}
