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

import type { WorkerGeometryData } from "@sienci/gviewer/viewer";
import pubsub from "pubsub-js";

/**
 * Holds the most recent `geometryReady` payload from Visualize.worker.
 *
 * The primary visualizer picks geometry up from the `file:load` pubsub event,
 * which only reaches components that were already mounted. Anything opened
 * later — the G-code step-through modal, for one — needs the same buffers
 * without re-parsing the file, so the response handler parks the payload here
 * and late arrivals read it on mount.
 *
 * The buffers are the worker's transferred ArrayBuffers; gviewer only ever
 * builds read-only views over them, so handing the same payload to a second
 * viewer is safe.
 */
let lastWorkerGeometry: WorkerGeometryData | null = null;

export const setLastWorkerGeometry = (
	data: WorkerGeometryData | null,
): void => {
	lastWorkerGeometry = data;
};

export const getLastWorkerGeometry = (): WorkerGeometryData | null =>
	lastWorkerGeometry;

pubsub.subscribe("gcode:unload", () => setLastWorkerGeometry(null));
pubsub.subscribe("unload:file", () => setLastWorkerGeometry(null));
