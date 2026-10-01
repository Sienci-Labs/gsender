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

import type { WorkerSegmentsData } from '@sienci/gviewer/viewer';

/**
 * Prepare a raw `geometryReady` payload for gviewer.
 *
 * gviewer colours cuts by the worker's per-tool palette (`paletteHex`) only when
 * `toolchangeCount` is greater than zero — otherwise every cut takes the theme's
 * single cutting colour. The worker reports the toolchanges as `info.toolchanges`,
 * but nothing sets the count on the payload itself, so any viewer handed the raw
 * message loses the tool colours. Every consumer must go through here.
 */
export function augmentWorkerGeometry(
    data: WorkerSegmentsData,
): WorkerSegmentsData {
    const raw = data as unknown as { info?: { toolchanges?: unknown } };
    const toolchangeCount = Array.isArray(raw.info?.toolchanges)
        ? raw.info.toolchanges.length
        : 0;
    return { ...data, toolchangeCount };
}

/** Whether a payload is worker toolpath geometry gviewer can load. */
export function isWorkerSegments(data: unknown): data is WorkerSegmentsData {
    return (
        !!data &&
        typeof data === 'object' &&
        (data as { format?: unknown }).format === 'segments-v1'
    );
}

/**
 * Views over the toolpath's vertex positions (x, y, z per vertex, one array
 * per chunk). No copy is made.
 */
export function toolpathPositionChunks(
    data: WorkerSegmentsData | null,
): Float32Array[] {
    if (!data) {
        return [];
    }
    return data.chunks.map(
        (chunk) => new Float32Array(chunk.positions, 0, chunk.vertexCount * 3),
    );
}
