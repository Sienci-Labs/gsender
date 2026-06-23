import fs from "fs";
import os from "os";
import path from "path";

export const SENTRY_DSN =
	"https://eeb4899f0415aa6bc9de477a7faeb720@o558751.ingest.us.sentry.io/4509479105986560";

export const STORE_FILENAME = "gsender-0.5.6.json";

const ELECTRON_APP_DATA_DIR_NAMES = ["gSender Edge", "gSender"];

const SENSITIVE_KEY_PATTERN =
	/token|password|secret|authorization|cookie|session|api[_-]?key/i;
const GCODE_FILE_PATTERN = /\.(gcode|gc|nc|tap|cnc)$/i;
const TOKEN_QUERY_PATTERN = /token=[^&\s]+/gi;

export function getSentryEnvironment(release) {
	if (process.env.NODE_ENV === "development") {
		return "development";
	}
	if (typeof release === "string" && release.includes("EDGE")) {
		return "edge";
	}
	return "production";
}

export function getUsageDataConsentFromStore(userDataPath, fsModule = fs) {
	try {
		const storePath = `${userDataPath}/${STORE_FILENAME}`;
		if (!fsModule.existsSync(storePath)) {
			return "pending";
		}
		const data = JSON.parse(fsModule.readFileSync(storePath, "utf8"));
		return data?.state?.workspace?.collectUsageDataStatus ?? "pending";
	} catch {
		return "pending";
	}
}

export function resolveConsentStoreDirectory() {
	if (process.env.GSENDER_USER_DATA) {
		return process.env.GSENDER_USER_DATA;
	}

	const home = os.homedir();
	const candidates = [];

	if (process.platform === "darwin") {
		for (const name of ELECTRON_APP_DATA_DIR_NAMES) {
			candidates.push(path.join(home, "Library", "Application Support", name));
		}
	} else if (process.platform === "win32") {
		const appData =
			process.env.APPDATA || path.join(home, "AppData", "Roaming");
		for (const name of ELECTRON_APP_DATA_DIR_NAMES) {
			candidates.push(path.join(appData, name));
		}
	} else {
		for (const name of ELECTRON_APP_DATA_DIR_NAMES) {
			candidates.push(path.join(home, ".config", name));
		}
	}

	for (const directory of candidates) {
		if (fs.existsSync(path.join(directory, STORE_FILENAME))) {
			return directory;
		}
	}

	return candidates[0] || home;
}

function scrubString(value) {
	if (typeof value !== "string") {
		return value;
	}
	if (value.length > 500) {
		return "[Truncated]";
	}
	if (GCODE_FILE_PATTERN.test(value)) {
		return "[Redacted file path]";
	}
	if (TOKEN_QUERY_PATTERN.test(value)) {
		return value.replace(TOKEN_QUERY_PATTERN, "token=[Redacted]");
	}
	return value;
}

function scrubObject(value, depth = 0) {
	if (depth > 6 || value == null) {
		return value;
	}
	if (typeof value === "string") {
		return scrubString(value);
	}
	if (Array.isArray(value)) {
		return value.map((item) => scrubObject(item, depth + 1));
	}
	if (typeof value !== "object") {
		return value;
	}

	const scrubbed = {};
	for (const [key, nestedValue] of Object.entries(value)) {
		if (SENSITIVE_KEY_PATTERN.test(key)) {
			scrubbed[key] = "[Redacted]";
			continue;
		}
		scrubbed[key] = scrubObject(nestedValue, depth + 1);
	}
	return scrubbed;
}

export function scrubSentryEvent(event) {
	if (!event) {
		return event;
	}

	if (event.request) {
		event.request = scrubObject(event.request);
	}
	if (event.extra) {
		event.extra = scrubObject(event.extra);
	}
	if (event.contexts) {
		event.contexts = scrubObject(event.contexts);
	}
	if (event.breadcrumbs) {
		event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
			...breadcrumb,
			message: scrubString(breadcrumb.message),
			data: scrubObject(breadcrumb.data),
		}));
	}
	if (event.exception?.values) {
		event.exception.values = event.exception.values.map((exception) => ({
			...exception,
			value: scrubString(exception.value),
		}));
	}

	return event;
}
