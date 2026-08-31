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

/**
 * Prepare a raw `geometryReady` payload for gviewer.
 *
 * gviewer keeps the worker's baked per-tool palette only when `toolchangeCount`
 * is greater than zero — otherwise it drops the per-vertex colours and draws
 * every cut in the theme's single cutting colour:
 *
 *     const hasToolchangeColors = (data.toolchangeCount ?? 0) > 0;
 *     cuts: [{ ..., colors: hasToolchangeColors ? cut.colors : undefined }]
 *
 * The worker reports the toolchange vertex boundaries as `info.toolchanges`, but
 * nothing sets the count on the payload itself, so any viewer handed the raw
 * message loses the tool colours. Every consumer must go through here.
 */
export function augmentWorkerGeometry(
	data: WorkerGeometryData,
): WorkerGeometryData {
	const raw = data as unknown as { info?: { toolchanges?: unknown } };
	const toolchangeCount = Array.isArray(raw.info?.toolchanges)
		? raw.info.toolchanges.length
		: 0;
	return { ...data, toolchangeCount };
}
