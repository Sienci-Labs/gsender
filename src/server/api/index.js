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

import * as version from './api.version';
import * as state from './api.state';
import * as gcode from './api.gcode';
import * as controllers from './api.controllers';
import * as watch from './api.watch';
import * as commands from './api.commands';
import * as events from './api.events';
import * as machines from './api.machines';
import * as macros from './api.macros';
import * as remote from './api.remote';
import * as mdi from './api.mdi';
import * as users from './api.users';
import * as files from './api.file';
import * as logs from './api.log';
import * as metrics from './api.metrics';
import * as jobStats from './api.jobstats';
import * as maintenance from './api.maintenance';
import * as alarmList from './api.alarmList';
import * as releaseNotes from './api.releasenotes';
import * as camera from './api.camera';

export {
    version,
    state,
    gcode,
    controllers,
    watch,
    commands,
    events,
    machines,
    macros,
    remote,
    mdi,
    users,
    files,
    logs,
    metrics,
    jobStats,
    maintenance,
    alarmList,
    releaseNotes,
    camera,
};
