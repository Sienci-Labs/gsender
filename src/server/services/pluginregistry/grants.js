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
 */

// Maps the SDK export names found by the static bundle scan
// (see pluginSecurity.ts) onto the permissions we show the user and the
// capabilities the plugin bridge enforces at runtime.
//
// This is the single source of truth for that mapping. It used to live in the
// renderer (features/Plugins/types.ts) back when the install flow was driven
// from there; the install pipeline is server-side now, so the grant is derived
// here and written straight into the staged manifest.

// Sentinel the scanner emits for `const sdk = require(...)` / unresolvable
// dynamic import — we can't tell which members are used, so it maps to
// everything the bridge can do.
const WHOLE_MODULE_SENTINEL = "*require-whole-module*";

const ALL_REQUEST_TYPES = [
	"machine:get:context",
	"machine:command",
	"machine:parser:register",
	"machine:parser:unregister",
	"machine:query",
	"machine:busy:set",
	"gcode:load:to:visualizer",
	"workspace:get:state",
	"redux:get:state",
	"viewer:screen-to-world",
	"viewer:world-to-screen",
	"viewer:camera:set",
	"viewer:camera:lock-rotate",
	"viewer:pick:arm",
	"viewer:pick:disarm",
	"viewer:overlay:set",
];

const VIEWER_REQUEST_TYPES = [
	"viewer:screen-to-world",
	"viewer:world-to-screen",
	"viewer:camera:set",
	"viewer:camera:lock-rotate",
	"viewer:pick:arm",
	"viewer:pick:disarm",
	"viewer:overlay:set",
];

const STORAGE_REQUEST_TYPES = [
	"storage:get",
	"storage:set",
	"storage:delete",
	"storage:get:all",
	"storage:set:all",
	"storage:clear",
];

export const permissionsMap = new Map([
	[
		"gsender",
		[
			"machine:read",
			"machine:write",
			"machine:parse",
			"machine:query",
			"visualizer:load",
			"workspace:read",
			"redux:read",
		],
	],
	["machine", ["machine:read", "machine:write", "machine:parse", "machine:query"]],
	["registerParser", ["machine:parse"]],
	["unregisterParser", ["machine:parse"]],
	["onParsed", ["machine:parse"]],
	["useParsed", ["machine:parse"]],
	["onLine", ["machine:parse"]],
	["getLastParsed", ["machine:parse"]],
	["onParserError", ["machine:parse"]],
	["query", ["machine:query", "machine:parse"]],
	["gcode", ["visualizer:load"]],
	["viewer", ["viewer:camera", "viewer:draw"]],
	["workspace", ["workspace:read"]],
	["getWorkspaceState", ["workspace:read"]],
	["subscribeWorkspaceState", ["workspace:read"]],
	["redux", ["redux:read"]],
	["getReduxState", ["redux:read"]],
	["getSelector", ["redux:read"]],
	["useWorkspaceState", ["workspace:read"]],
	["subscribeSelector", ["redux:read"]],
	["useTypedSelector", ["redux:read"]],
	["storage", ["storage"]],
]);

export const requestTypesMap = new Map([
	[WHOLE_MODULE_SENTINEL, ALL_REQUEST_TYPES],
	["gsender", ALL_REQUEST_TYPES],
	[
		"machine",
		[
			"machine:get:context",
			"machine:command",
			"machine:parser:register",
			"machine:parser:unregister",
			"machine:query",
			"machine:busy:set",
		],
	],
	["registerParser", ["machine:parser:register"]],
	["unregisterParser", ["machine:parser:unregister"]],
	// onParsed/onLine register an anonymous parser under the hood, so they need
	// the register/unregister request types too, not just the topic.
	["onLine", ["machine:parser:register", "machine:parser:unregister"]],
	["query", ["machine:query"]],
	["gcode", ["gcode:load:to:visualizer"]],
	["viewer", VIEWER_REQUEST_TYPES],
	["workspace", ["workspace:get:state"]],
	["getWorkspaceState", ["workspace:get:state"]],
	["redux", ["redux:get:state"]],
	["getReduxState", ["redux:get:state"]],
	["getSelector", ["redux:get:state"]],
	["storage", STORAGE_REQUEST_TYPES],
]);

export const topicsMap = new Map([
	["subscribeWorkspaceState", "workspace"],
	["subscribeSelector", "redux"],
	["useWorkspaceState", "workspace"],
	["useTypedSelector", "redux"],
	["onParsed", "parser"],
	["useParsed", "parser"],
	["onLine", "parser"],
	["getLastParsed", "parser"],
	["onParserError", "parser"],
	["registerParser", "parser"],
	["viewer", "viewer"],
	["useVisualizerPick", "viewer"],
]);

// The import specifiers the permission scanner looks for in a plugin's built
// bundle. Must stay in sync with SDK_SPECIFIERS in the SDK's config.
export const SDK_SCAN_SPECIFIERS = [
	"@sienci/gsender-plugin-sdk",
	"@sienci/gsender-plugin-sdk/react",
	"@sienci/gsender-plugin-sdk/viewer",
];

// Turn the scanner's raw export names into the human-readable permission
// labels shown on the review step, plus the capability grant written to the
// manifest and enforced by the bridge.
export const buildGrantFromScan = (scanned) => {
	const names = Array.isArray(scanned)
		? scanned.filter((name) => typeof name === "string")
		: [];

	const permissions = [
		...new Set(names.flatMap((name) => permissionsMap.get(name) ?? [])),
	];
	const requestTypes = [
		...new Set(names.flatMap((name) => requestTypesMap.get(name) ?? [])),
	];
	const topics = [
		...new Set(
			names.flatMap((name) => {
				const topic = topicsMap.get(name);
				return topic === undefined ? [] : [topic];
			}),
		),
	];
	const allowedFunctions = names.filter(
		(name) => name !== WHOLE_MODULE_SENTINEL,
	);

	return {
		permissions,
		capabilities: { requestTypes, topics, allowedFunctions },
	};
};

/**
 * Folds manifest-declared parsers into a scanned grant.
 *
 * Manifest parsers run server-side and involve no SDK import at all, so
 * buildGrantFromScan — which only ever sees the built bundle — cannot detect
 * them. Without this, a plugin could read the raw firmware stream while the
 * approval dialog showed no corresponding permission.
 */
export const mergeManifestParserGrant = (grant, parsers) => {
	if (!Array.isArray(parsers) || parsers.length === 0) {
		return grant;
	}

	return {
		permissions: [...new Set([...grant.permissions, "machine:parse"])],
		capabilities: {
			...grant.capabilities,
			topics: [...new Set([...(grant.capabilities?.topics ?? []), "parser"])],
		},
	};
};
