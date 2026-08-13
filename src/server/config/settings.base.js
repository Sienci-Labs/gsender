/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import isElectron from "is-electron";
import pkg from "../../package.json";

const RC_FILE = pkg.version.includes("EDGE") ? ".edge_rc" : ".sender_rc";
const ERROR_FILE = pkg.version.includes("EDGE")
	? ".edge_errorrc"
	: ".sender_errorrc";
const JOB_FILE = pkg.version.includes("EDGE") ? ".edge_jobrc" : ".sender_jobrc";
const SESSION_PATH = ".sienci-sessions";

// Secret
const secret = pkg.version;

//const getUserHome = () => (process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']);
const getUserHome = () => os.homedir();

// Electron app.getPath('userData') uses package.json "name", not build.productName.
const getAppName = () => pkg.name || "gSender";

// Mirror Electron app.getPath('userData') when the server runs outside Electron (CLI dev).
const getDefaultUserDataPath = () => {
	const home = getUserHome();
	const appName = getAppName();

	if (process.platform === "darwin") {
		return path.join(home, "Library", "Application Support", appName);
	}

	if (process.platform === "win32") {
		const appData =
			process.env.APPDATA || path.join(home, "AppData", "Roaming");
		return path.join(appData, appName);
	}

	const configHome = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
	return path.join(configHome, appName);
};

const getUserDataPath = () => {
	if (process.env.GSENDER_USER_DATA) {
		return process.env.GSENDER_USER_DATA;
	}

	if (isElectron()) {
		try {
			const { app } = require("electron");
			if (app && app.getPath) {
				return app.getPath("userData");
			}
		} catch (err) {
			// Fall through to the default userData path below.
		}
	}

	return getDefaultUserDataPath();
};

// Additional plugin directories scanned alongside the primary (user-data)
// pluginsDir. Used so that, in development, plugins can be loaded straight from
// the repo-root `plugins/` folder without copying them into Application Support.
const getExtraPluginsDirs = () => {
	const dirs = [];

	// Explicit override: OS-native path list (":" on posix, ";" on win32).
	if (process.env.GSENDER_PLUGINS_DIRS) {
		process.env.GSENDER_PLUGINS_DIRS.split(path.delimiter)
			.map((entry) => entry.trim())
			.filter(Boolean)
			.forEach((entry) => dirs.push(path.resolve(entry)));
	}

	// In development the server is launched from the repo root, so the source
	// `plugins/` folder lives at cwd. The registry checks existence before use.
	if (process.env.NODE_ENV === "development") {
		dirs.push(path.resolve(process.cwd(), "plugins"));
	}

	// In production builds we bundle selected default plugins under the app
	// output root at "<build>/plugins". This settings code is BUNDLED into
	// several entries whose __dirname differs at runtime: "<build>" for
	// server-cli.js/main.js, "<build>/server" for server/index.js.
	// Probe both.
	if (process.env.NODE_ENV === "production") {
		dirs.push(resolveBuildDir("plugins"));
	}

	return dirs;
};

// Resolve a directory that ships at the app build root ("<build>/<name>"),
// from bundled code whose __dirname is either "<build>" or "<build>/server".
const resolveBuildDir = (name) => {
	const candidates = [
		path.resolve(__dirname, name),
		path.resolve(__dirname, "..", name),
	];
	return candidates.find((dir) => fs.existsSync(dir)) || candidates[0];
};

// Directory holding the plugin SDK's built ESM runtime ({index,react,
// viewer}.js). Served at `pluginSdkRoute` so the import map a plugin's
// build injects can resolve the bare @sienci/gsender-plugin-sdk
// specifiers inside the plugin iframe. Keep the route in sync with
// HOST_SDK_ROUTE in the sdk's vite-plugin.ts.
const getPluginSdkDir = () => {
	if (process.env.GSENDER_PLUGIN_SDK_DIR) {
		return path.resolve(process.env.GSENDER_PLUGIN_SDK_DIR);
	}

	// In development the server is launched from the repo root; serve the
	// workspace build output directly.
	if (process.env.NODE_ENV === "development") {
		return path.resolve(process.cwd(), "packages", "plugin-sdk", "dist");
	}

	// Production builds bundle the SDK dist at "<build>/plugin-sdk"
	return resolveBuildDir("plugin-sdk");
};

export default {
	rcfile: path.resolve(getUserHome(), RC_FILE),
	errorFile: path.resolve(getUserHome(), ERROR_FILE),
	jobFile: path.resolve(getUserHome(), JOB_FILE),
	verbosity: 0,
	version: pkg.version,

	// The secret key is loaded from the config file (defaults to "~/.cncrc")
	// @see "src/app/index.js"
	secret: secret,

	// Access Token Lifetime
	accessTokenLifetime: "30d", // https://github.com/zeit/ms

	// Allow Remote Access
	allowRemoteAccess: false,

	// Express view engine
	view: {
		// Set html (w/o dot) as the default extension
		defaultExtension: "html",

		// Format: <extension>: <template>
		engines: [
			{
				// Hogan template with .html extension
				extension: "html",
				template: "hogan",
			},
			{
				// Hogan template with .hbs extension
				extension: "hbs",
				template: "hogan",
			},
			{
				// Hogan template with .hogan extension
				extension: "hogan",
				template: "hogan",
			},
		],
	},
	// Middleware (https://github.com/senchalabs/connect)
	middleware: {
		// https://github.com/expressjs/body-parser
		"body-parser": {
			json: {
				// maximum request body size. (default: <100kb>)
				limit: "256mb",
			},
			urlencoded: {
				extended: true,
				// maximum request body size. (default: <100kb>)
				limit: "256mb",
			},
		},
		// https://github.com/mscdex/connect-busboy
		busboy: {
			limits: {
				fileSize: 256 * 1024 * 1024, // 256MB
			},
			// immediate
			//   false: no immediate parsing
			//   true: immediately start reading from the request stream and parsing
			immediate: false,
		},
		// https://github.com/andrewrk/node-multiparty/
		multiparty: {
			// Limits the amount of memory a field (not a file) can allocate in bytes. If this value is exceeded, an error event is emitted. The default size is 2MB.
			maxFieldsSize: 50 * 1024 * 1024, // 20MB

			// Limits the number of fields that will be parsed before emitting an error event. A file counts as a field in this case. Defaults to 1000.
			maxFields: 1000,
		},
		// https://github.com/expressjs/morgan
		morgan: {
			// The ':id' token is defined at app.js
			format:
				":id \x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m \x1b[34m:status\x1b[0m :response-time ms",
		},
		// https://github.com/expressjs/compression
		compression: {
			// response is only compressed if the byte size is at or above this threshold.
			threshold: 512,
		},
		// https://github.com/expressjs/session
		session: {
			path: path.resolve(getUserHome(), SESSION_PATH),
		},
	},
	siofu: {
		// SocketIOFileUploader
		dir: path.resolve(getUserDataPath(), "tmp", "siofu"),
	},
	i18next: {
		lowerCaseLng: true,

		// logs out more info (console)
		debug: false,

		// language to lookup key if not found on set language
		fallbackLng: "en",

		// string or array of namespaces
		ns: [
			"config",
			"resource", // default
		],

		// default namespace used if not passed to translation function
		defaultNS: "resource",

		whitelist: ["en"],

		// array of languages to preload
		preload: [],

		// language codes to lookup, given set language is 'en-US':
		// 'all' --> ['en-US', 'en', 'dev']
		// 'currentOnly' --> 'en-US'
		// 'languageOnly' --> 'en'
		load: "currentOnly",

		// char to separate keys
		keySeparator: ".",

		// char to split namespace from key
		nsSeparator: ":",

		interpolation: {
			prefix: "{{",
			suffix: "}}",
		},

		detection: {
			// order and from where user language should be detected
			order: ["session", "querystring", "cookie", "header"],

			// keys or params to lookup language from
			lookupQuerystring: "lang",
			lookupCookie: "lang",
			lookupSession: "lang",

			// cache user language
			caches: ["cookie"],
		},

		backend: {
			// path where resources get loaded from
			loadPath: path.resolve(__dirname, "..", "i18n", "{{lng}}", "{{ns}}.json"),

			// path to post missing resources
			addPath: path.resolve(
				getUserDataPath(),
				"i18n",
				"{{lng}}",
				"{{ns}}.savedMissing.json",
			),

			// jsonIndent to use when storing json files
			jsonIndent: 4,
		},
	},

	pluginsDir: path.resolve(getUserDataPath(), "plugins"),
	extraPluginsDirs: getExtraPluginsDirs(),
	pluginSdkDir: getPluginSdkDir(),
	pluginSdkRoute: "/plugin-sdk",
};
