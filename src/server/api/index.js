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

import * as alarmList from "./api.alarmList";
import * as commands from "./api.commands";
import * as controllers from "./api.controllers";
import * as events from "./api.events";
import * as files from "./api.file";
import * as gcode from "./api.gcode";
import * as jobStats from "./api.jobstats";
import * as logs from "./api.log";
import * as machines from "./api.machines";
import * as macros from "./api.macros";
import * as maintenance from "./api.maintenance";
import * as mdi from "./api.mdi";
import * as metrics from "./api.metrics";
import * as preferences from "./api.preferences";
import * as releaseNotes from "./api.releasenotes";
import * as remote from "./api.remote";
import * as state from "./api.state";
import * as users from "./api.users";
import * as version from "./api.version";
import * as watch from "./api.watch";

export {
	alarmList,
	commands,
	controllers,
	events,
	files,
	gcode,
	jobStats,
	logs,
	machines,
	macros,
	maintenance,
	mdi,
	metrics,
	preferences,
	releaseNotes,
	remote,
	state,
	users,
	version,
	watch,
};
