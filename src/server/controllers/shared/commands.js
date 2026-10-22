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

import ensureArray from "ensure-array";
import _ from "lodash";
import {
	CYCLE_START,
	FEED_HOLD,
	FILE_UNLOAD,
	MACRO_RUN,
	SLEEP,
} from "../../../app/src/constants";
import delay from "../../lib/delay";
import ensurePositiveNumber from "../../lib/ensure-positive-number";
import { WORKFLOW_STATE_RUNNING } from "../../lib/Workflow";
import config from "../../services/configstore";
import store from "../../store";
import { calcOverrides } from "../runOverride";

// Commands the jog streamer either owns or can safely coexist with. Everything
// else aborts an active stream before it runs.
const JOG_COMMANDS = [
	"jog:start",
	"jog:update",
	"jog:feed",
	"jog:stop",
	"jog:cancel",
];
const STREAM_SAFE_COMMANDS = [
	"statusreport",
	"reset",
	"reset:soft",
	"reset:quit",
];
const noop = _.noop;

// Firmware handlers retain their controller's closures and take precedence over
// shared commands. Keep the originating logger so diagnostics identify firmware.
export function dispatchCommand(controller, cmd, args, firmwareHandlers, log) {
	const handler = {
		"firmware:recievedProfiles": () => {
			const [files] = args;
			controller.emit("task:finish", files);
		},
		"firmware:grabMachineProfile": () => {
			const machineProfile = store.get("machineProfile");
			controller.emit("sender:status", machineProfile);
		},
		"gcode:unload": () => {
			controller.workflow.stop();
			controller.engine.unload();

			// Sender
			controller.sender.unload();

			controller.emit("file:unload");
			controller.event.trigger(FILE_UNLOAD);
		},
		start: () => {
			log.warn(
				`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`,
			);
			controller.command("gcode:start");
		},
		stop: () => {
			log.warn(
				`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`,
			);
			controller.command("gcode:stop", ...args);
		},
		pause: () => {
			log.warn(
				`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`,
			);
			controller.command("gcode:pause");
		},
		resume: () => {
			log.warn(
				`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`,
			);
			controller.command("gcode:resume");
		},
		"feeder:feed": () => {
			const [commands, context = {}] = args;
			controller.command("gcode", commands, context);
		},
		"feeder:start": async () => {
			if (controller.workflow.state === WORKFLOW_STATE_RUNNING) {
				return;
			}
			controller.write("~");
			await delay(1000);
			controller.feeder.unhold();
			controller.feeder.next();
		},
		feedhold: () => {
			controller.event.trigger(FEED_HOLD);

			controller.write("!");
		},
		cyclestart: () => {
			controller.event.trigger(CYCLE_START);

			controller.write("~");
		},
		statusreport: () => {
			controller.write("?");
		},
		sleep: () => {
			controller.event.trigger(SLEEP);

			controller.writeln("$SLP");
		},
		populateConfig: () => {
			controller.writeln("$$");
		},
		reset: () => {
			controller.workflow.stop();

			controller.feeder.reset();

			controller.write("\x18"); // ^x
		},
		// Feed Overrides
		// @param {number} value The amount of percentage increase or decrease.
		feedOverride: () => {
			const [value] = args;
			const [feedOV] = controller.state.status.ov;

			const diff = value - feedOV;

			if (value === 100) {
				controller.FOQueue.push(String.fromCharCode(0x90));
			} else {
				controller.FOQueue.push(...calcOverrides(diff, "feed"));
			}
			controller.consumeFOQ();

			controller.sender.setOvF(value);
		},
		// Spindle Speed Overrides
		// @param {number} value The amount of percentage increase or decrease.
		spindleOverride: () => {
			const [value] = args;
			const [, , spindleOV] = controller.state.status.ov;

			let diff = value - spindleOV;
			//Limits for keyboard/gamepad shortcuts
			if (value < 10) {
				diff = 10 - spindleOV;
			} else if (value > 230) {
				diff = 230 - spindleOV;
			}

			if (value === 100) {
				controller.SOQueue.push(String.fromCharCode(0x99));
			} else {
				controller.SOQueue.push(...calcOverrides(diff, "spindle"));
			}
			controller.consumeSOQ();
		},
		// Rapid Overrides
		// @param {number} value A percentage value of 25, 50, or 100. A value of zero will reset to 100%.
		// 100: Set to 100% full rapid rate.
		//  50: Set to 50% of rapid rate.
		//  25: Set to 25% of rapid rate.
		rapidOverride: () => {
			const [value] = args;

			if (value === 0 || value === 100) {
				controller.write("\x95");
			} else if (value === 50) {
				controller.write("\x96");
			} else if (value === 25) {
				controller.write("\x97");
			}
		},
		"lasertest:off": () => {
			const commands = ["M5S0"];
			controller.command("gcode", commands);
		},
		"laserpower:change": () => {
			const [power = 0, maxS = 1000] = args;
			const commands = [
				// https://github.com/gnea/grbl/wiki/Grbl-v1.1-Laser-Mode
				// The laser will only turn on when Grbl is in a G1, G2, or G3 motion mode.
				"S" +
					Math.round(ensurePositiveNumber(maxS * (power / 100)) * 100) / 100,
			];
			controller.command("gcode", commands);
		},
		"spindlespeed:change": () => {
			const [speed = 0] = args;
			const commands = ["S" + speed];
			controller.command("gcode", commands);
		},
		gcode: () => {
			const [commands, context] = args;
			const data = ensureArray(commands)
				.join("\n")
				.split(/\r?\n/)
				.filter((line) => {
					if (typeof line !== "string") {
						return false;
					}

					return line.trim().length > 0;
				});

			controller.feeder.feed(data, context);

			if (!controller.feeder.isPending()) {
				controller.feeder.next();
			}
		},
		"gcode:safe": () => {
			const [commands, prefUnits] = args;
			const deviceUnits = controller.state.parserstate.modal.units;
			let code = [];

			if (!deviceUnits) {
				log.error("Unable to determine device unit modal");
				return;
			}
			// Force command in preferred units
			if (prefUnits !== deviceUnits) {
				code.push(prefUnits);
			}
			code = code.concat(commands);
			// return modal to previous state if they were different previously
			if (prefUnits !== deviceUnits) {
				code = code.concat(deviceUnits);
			}
			controller.command("gcode", code);
		},
		"jog:update": () => {
			const [axes, feedrate] = args;
			controller.jogStreamer.update({ axes, feedrate });
		},
		"jog:stop": () => {
			controller.jogStreamer.stop();
			controller.write("\x85");
		},
		"jog:cancel": () => {
			controller.jogStreamer.abort("cancel");
			controller.write("\x85");
		},
		"macro:run": () => {
			let [id, context = {}, callback = noop] = args;
			if (typeof context === "function") {
				callback = context;
				context = {};
			}
			const macros = config.get("macros");
			const macro = _.find(macros, { id: id });

			if (!macro) {
				log.error(`Cannot find the macro: id=${id}`);
				return;
			}

			controller.event.trigger(MACRO_RUN);
			controller.command("gcode", macro.content, context);

			callback(null);
		},
		"machineprofile:load": () => {
			const [machineProfile] = args;

			store.set("machineProfile", machineProfile);
		},
		"settings:updated": () => {
			const [newSettings = {}] = args;

			const currentSettings = store.get("preferences") || {};

			const updated = {
				...currentSettings,
				...newSettings,
			};

			store.set("preferences", updated);
		},
		"toolchange:pre": () => {
			log.debug("Starting pre hook");
			controller.runPreChangeHook();
		},
		"toolchange:post": () => {
			log.debug("starting post hook");
			controller.command("feeder:start");
			controller.runPostChangeHook();
		},
		"wizard:start": () => {
			log.debug("Wizard kickoff code");
			const [gcode] = args;

			controller.toolChanger.addInterval(() => {
				controller.command("gcode", gcode);
			});
		},
		"wizard:step": () => {
			const [stepIndex, substepIndex] = args;
			controller.feederCB = () => {
				controller.emit("wizard:next", stepIndex, substepIndex);
			};
		},
		updateEstimateData: () => {
			const [estimateData] = args;
			controller.sender.setEstimateData(estimateData);
		},
		...firmwareHandlers,
	}[cmd];

	if (!handler) {
		log.error(`Unknown command: ${cmd}`);
		return;
	}

	// A jog stream consumes its own acks, which is only safe while it is the
	// sole writer of ack-producing lines. Anything else claiming the link
	// ends the stream first.
	if (
		controller.jogStreamer.isActive() &&
		!JOG_COMMANDS.includes(cmd) &&
		!STREAM_SAFE_COMMANDS.includes(cmd)
	) {
		controller.jogStreamer.abort(`command:${cmd}`);
	}

	handler();
}
