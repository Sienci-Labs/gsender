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

// import colornames from 'colornames';
import * as THREE from 'three';
import _get from 'lodash/get';
import { store as reduxStore } from 'app/store/redux';
import { CUTTING_PART, PLANNED_PART, SECONDARY_COLOR } from './constants';
import { checkIfRotaryFile } from '../../lib/rotary';

const STATES = {
    START: 0,
    RUNNING: 1,
    DONE: 2,
};

// Lead color: buffered toolpath just ahead of the toolhead, between the
// executed (grey) path and the rest of the buffered (yellow) path.
const PROGRESS_LEAD_COLOR = '#ff8000'; // orange

// Max distance (mm) from the toolhead to the nearest in-flight segment for the
// split to track it; beyond this (jogging off the path) the split freezes.
const PROGRESS_NEAR_MM = 2;

class GCodeVisualizer {
    constructor(theme) {
        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.theme = theme;
        this.vertices = [];
        this.colors = [];
        this.originalColors = null;
        this.isLaser = false;
        this.frames = []; // Example
        this.frameIndex = 0;
        this.oldFrameIndex = null;
        this.plannedColorArray = [];
        this.plannedV1 = null;
        this.plannedState = STATES.START;
        // --rotary
        this.frameDifferences = Array(16).fill(null); // queue, stores up to 16 frame differences (v2 - v1)
        this.oldV1s = Array(16).fill(null); // queue, stores up to 16 frames (v1)
        this.countdown = 16; // counter
        this.isRotaryFile = false;
        // rotary--
        // Hide processed lines
        this.hideProcessedLines = false;

        // Run-progress painter state: grey edge already painted (incremental),
        // previous acked edge (for rewind restore), and the cached arc-length
        // table for sizing the orange lead.
        this._progGreyEndV = 0;
        this._progAheadEndV = 0;
        this._cumLen = null;
        // Crisp-split position (segment + 0..1 param), kept monotonic so it
        // never slides backward within a segment; reset when the segment changes.
        this._progSplitSegFloor = -1;
        this._progSplitSegFwd = -1;
        this._progSplitT = 0;

        return this;
    }

    render({ vertices, frames, isLaser = false }, colorArray, savedColors) {
        this.vertices = new THREE.BufferAttribute(vertices, 3);
        this.frames = frames;
        this.isLaser = isLaser;
        this.isRotaryFile = false;
        // New geometry: drop the cached arc-length table so it rebuilds lazily.
        this._cumLen = null;
        const baseColors =
            savedColors && savedColors.length === colorArray.length
                ? savedColors
                : colorArray;
        this.colors = baseColors;
        this.originalColors = null;
        const defaultColor = new THREE.Color(this.theme.get(CUTTING_PART));
        // --rotary
        this.countdown = 16;
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);
        // rotary--

        // check if file is rotary
        const gcode = _get(reduxStore.getState(), 'file.content', '');
        this.isRotaryFile = checkIfRotaryFile(gcode);

        this.geometry.setAttribute('position', this.vertices);
        this.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(baseColors, 4),
        );

        const material = new THREE.LineBasicMaterial({
            color: defaultColor,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
        });

        const workpiece = new THREE.Line(this.geometry, material);
        workpiece.name = 'workpiece';
        this.group.add(workpiece);

        return this.group;
    }

    _ensureOriginalColorsSnapshot() {
        if (this.originalColors) {
            return;
        }
        const workpiece = this.group.children[0];
        const colorAttr = workpiece?.geometry?.getAttribute('color');
        if (!colorAttr || !colorAttr.array) {
            return;
        }
        this.originalColors = new Float32Array(colorAttr.array);
    }

    // The in-buffer / planned color (theme PLANNED_PART, yellow by default).
    _plannedColor() {
        return new THREE.Color(this.theme.get(PLANNED_PART));
    }

    // Overlay line for a crisp grey/lead boundary at the toolhead. The main
    // toolpath is one vertex-colored Line, so the tool's segment can only show a
    // gradient; this short overlay (depthTest off, drawn on top) redraws that
    // segment with a temp vertex at the machine position for a sharp split.
    _ensureProgressSplitLine() {
        if (this._progSplitLine) return;
        // 4 vertices: A, split, split, B. Duplicating the split vertex lets the
        // executed half and the ahead half carry solid colors with no gradient
        // between them.
        this._progSplitPositions = new Float32Array(4 * 3);
        this._progSplitColors = new Float32Array(4 * 4);
        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
            'position',
            new THREE.BufferAttribute(this._progSplitPositions, 3),
        );
        geom.setAttribute(
            'color',
            new THREE.BufferAttribute(this._progSplitColors, 4),
        );
        const mat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
        });
        const line = new THREE.Line(geom, mat);
        line.name = 'progressSplitOverlay';
        line.renderOrder = 500;
        line.frustumCulled = false;
        line.visible = false;
        this._progSplitGeometry = geom;
        this._progSplitMaterial = mat;
        this._progSplitLine = line;
        this.group.add(line);
    }

    _hideProgressSplit() {
        if (this._progSplitLine) this._progSplitLine.visible = false;
    }

    // Lazily build + cache cumulative arc length per vertex; differencing two
    // entries gives mm of path travel (used to size the orange lead).
    _ensureCumLen() {
        if (this._cumLen) return this._cumLen;
        const pos = this.vertices && this.vertices.array;
        const n = this.vertices ? this.vertices.count : 0;
        if (!pos || !n) return null;
        const cum = new Float64Array(n);
        let acc = 0;
        for (let v = 1; v < n; v++) {
            const dx = pos[v * 3] - pos[(v - 1) * 3];
            const dy = pos[v * 3 + 1] - pos[(v - 1) * 3 + 1];
            const dz = pos[v * 3 + 2] - pos[(v - 1) * 3 + 2];
            acc += Math.sqrt(dx * dx + dy * dy + dz * dz);
            cum[v] = acc;
        }
        this._cumLen = cum;
        return cum;
    }

    // Draw the overlay on [vFloor, vFwd] with the split at the projection of the
    // machine position; grey* colors the executed half, aheadColor the rest.
    _updateProgressSplit(vFloor, vFwd, cutterPos, greyColor, greyAlpha, aheadColor) {
        this._ensureProgressSplitLine();
        const srcPos = this.vertices && this.vertices.array;
        if (!srcPos || !cutterPos || vFwd <= vFloor) {
            this._hideProgressSplit();
            return;
        }
        const ax = srcPos[vFloor * 3];
        const ay = srcPos[vFloor * 3 + 1];
        const az = srcPos[vFloor * 3 + 2];
        const bx = srcPos[vFwd * 3];
        const by = srcPos[vFwd * 3 + 1];
        const bz = srcPos[vFwd * 3 + 2];
        const ex = bx - ax;
        const ey = by - ay;
        const ez = bz - az;
        const len2 = ex * ex + ey * ey + ez * ez;
        if (len2 === 0) {
            this._hideProgressSplit();
            return;
        }
        let t =
            ((cutterPos.x - ax) * ex +
                (cutterPos.y - ay) * ey +
                (cutterPos.z - az) * ez) /
            len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        // Monotonic split: never slide the boundary backward within a segment
        // (reset when the segment changes).
        if (
            this._progSplitSegFloor === vFloor &&
            this._progSplitSegFwd === vFwd
        ) {
            if (t < this._progSplitT) t = this._progSplitT;
        } else {
            this._progSplitSegFloor = vFloor;
            this._progSplitSegFwd = vFwd;
        }
        this._progSplitT = t;
        const sx = ax + t * ex;
        const sy = ay + t * ey;
        const sz = az + t * ez;

        const p = this._progSplitPositions;
        p[0] = ax; p[1] = ay; p[2] = az;
        p[3] = sx; p[4] = sy; p[5] = sz;
        p[6] = sx; p[7] = sy; p[8] = sz;
        p[9] = bx; p[10] = by; p[11] = bz;

        const c = this._progSplitColors;
        c[0] = greyColor.r; c[1] = greyColor.g; c[2] = greyColor.b; c[3] = greyAlpha;
        c[4] = greyColor.r; c[5] = greyColor.g; c[6] = greyColor.b; c[7] = greyAlpha;
        c[8] = aheadColor.r; c[9] = aheadColor.g; c[10] = aheadColor.b; c[11] = 1;
        c[12] = aheadColor.r; c[13] = aheadColor.g; c[14] = aheadColor.b; c[15] = 1;

        this._progSplitGeometry.getAttribute('position').needsUpdate = true;
        this._progSplitGeometry.getAttribute('color').needsUpdate = true;
        this._progSplitLine.visible = true;
    }

    setFrameIndex(frameIndex) {
        if (this.frames.length === 0) {
            return;
        }
        const plannedColor = new THREE.Color(this.theme.get(PLANNED_PART));
        const defaultColorArray = [...plannedColor.toArray(), 1]; // yellow

        frameIndex = Math.min(frameIndex, this.frames.length - 1);
        frameIndex = Math.max(frameIndex, 0);

        const v1 = this.frames[this.frameIndex];
        const v2 = this.frames[frameIndex]; // recieved lines

        if (v1 < v2) {
            // this is just a temporary fix for rotary, so there is some repeated code in both the if and else,
            // but it makes it easy to take away and edit later if i organize it like this
            if (this.isRotaryFile) {
                this._ensureOriginalColorsSnapshot();
                // subtract countdown and advance the queue
                this.countdown -= 1;
                this.frameDifferences.shift();
                this.frameDifferences.push(v2 - v1);
                this.oldV1s.shift();
                this.oldV1s.push(v1);

                const workpiece = this.group.children[0];
                const offsetIndex = this.oldV1s[0] * 4; // use the oldest v1, as that's where we are updating from
                const bufferOffsetIndex = v1 * 4;
                const colorAttr = workpiece.geometry.getAttribute('color');

                if (this.hideProcessedLines && this.oldV1s[0] > 0) {
                    this._hideProcessedVertices(this.oldV1s[0]);
                }

                const opacity = this.isLaser ? 1 : 0.3;
                const defaultColor = new THREE.Color(
                    this.theme.get(CUTTING_PART),
                );
                const defaultColorArray = [...defaultColor.toArray(), opacity]; // grey
                const defaultBufferColorArray = [...plannedColor.toArray(), 1]; // yellow
                const placeHolderColorArray = [...plannedColor.toArray(), 1]; // yellow

                // add the distance between the current movement and 19 moves ago
                let placeHolderLength = 0;
                this.frameDifferences.forEach((num, i) => {
                    // if first or last, skip
                    // these are already covered by colorArray and bufferColorArray
                    if (i === 0 || i === this.frameDifferences.length - 1) {
                        return;
                    }
                    placeHolderLength += num;
                });

                const colorArray = Array.from(
                    { length: this.frameDifferences[0] },
                    () => defaultColorArray,
                ).flat(); // grey, 16 movements ago
                const bufferColorArray = Array.from(
                    { length: v2 - v1 },
                    () => defaultBufferColorArray,
                ).flat(); // current movement
                const placeHolderArray = Array.from(
                    { length: placeHolderLength },
                    () => placeHolderColorArray,
                ).flat(); // all movements in between

                // if finished counting down, start greying out the old movements
                if (this.countdown <= 0) {
                    colorAttr.set(
                        [
                            ...colorArray,
                            ...placeHolderArray,
                            ...bufferColorArray,
                        ],
                        offsetIndex,
                    );
                    colorAttr.addUpdateRange({
                        start: offsetIndex,
                        count:
                            colorArray.length +
                            placeHolderArray.length +
                            bufferColorArray.length,
                    });
                } else {
                    // if not finished, continue colouring yellow
                    colorAttr.set([...bufferColorArray], bufferOffsetIndex);
                    colorAttr.addUpdateRange({
                        start: bufferOffsetIndex,
                        count: bufferColorArray.length,
                    });
                }
                colorAttr.needsUpdate = true;
            } else {
                // if v1 is 0, we don't want to add the planned colour array because it will be too long and
                // cause the yellow colouring to be past what we are tracking
                if (v1 > 0) {
                    const colorArray = Array.from(
                        { length: v2 - v1 },
                        () => defaultColorArray,
                    ).flat(); // current movement
                    // cant set yet, because grey lines will also be calculated soon
                    this.plannedColorArray = colorArray;
                }
                this.plannedV1 = this.frames[this.frameIndex - 1];
            }
        }

        // Restore the path to its original colors
        if (v2 < v1) {
            // reset vars
            this.oldFrameIndex = null;
            this.plannedColorArray = [];
            this.plannedV1 = null;
            this.plannedState = STATES.START;
            // Pull the run-progress painter's edges back to the rewound
            // position so it re-paints orange/yellow forward from here (the
            // [v2, v1) restore below clears the abandoned ahead band).
            this._progGreyEndV = Math.min(this._progGreyEndV || 0, v2);
            this._progAheadEndV = Math.min(this._progAheadEndV || 0, v2);
            // --rotary
            this.frameDifferences = Array(16).fill(-1);
            this.oldV1s = Array(16).fill(-1);
            this.countdown = 16;
            // rotary--

            // reset colours
            const workpiece = this.group.children[0];
            const sourceColors = this.originalColors || this.colors;
            if (!sourceColors) {
                this.frameIndex = frameIndex;
                return;
            }
            for (let i = v2; i < v1; ++i) {
                const offsetIndex = i * 4; // Account for RGB buffer
                workpiece.geometry.attributes.color.set(
                    [...sourceColors.slice(offsetIndex, offsetIndex + 4)],
                    offsetIndex,
                );
            }
            workpiece.geometry.attributes.color.needsUpdate = true;
        }

        // Per-frame hide backstop (greyOutLines needs a sender status; this
        // doesn't). Rotary files have no run-progress bands, so hide to the
        // received edge; otherwise stop at the grey/lead boundary maintained
        // by greyOutLines so the orange lead and yellow buffer stay visible.
        if (this.hideProcessedLines && v2 > 0) {
            if (this.isRotaryFile) {
                this._hideProcessedVertices(v2);
            } else {
                const greyEdge = Math.min(this._progGreyEndV || 0, v2);
                if (greyEdge > 0) {
                    this._hideProcessedVertices(greyEdge);
                }
            }
        }

        this.frameIndex = frameIndex;
    }

    // Paint run-progress coloring: GREY behind the toolhead, ORANGE for a short
    // look-ahead lead, YELLOW for the rest of the buffered range. currentLineRunning
    // (wall-clock progress line) is only a fallback when cutterPos (machine
    // position) is null.
    greyOutLines(currentLineRunning, cutterPos) {
        currentLineRunning = Math.min(
            currentLineRunning,
            this.frames.length - 1,
        );
        currentLineRunning = Math.max(currentLineRunning, 0);

        // Rotary files color the toolpath in setFrameIndex; nothing to paint
        // here (mirrors the stock branch, which was guarded by !isRotaryFile).
        if (this.isRotaryFile) {
            this._hideProgressSplit();
            this.oldFrameIndex = Math.max(0, currentLineRunning - 1);
            return;
        }

        const workpiece = this.group.children[0];
        if (!workpiece) {
            this._hideProgressSplit();
            return;
        }
        const colorAttr = workpiece.geometry.getAttribute('color');
        if (!colorAttr) {
            this._hideProgressSplit();
            return;
        }
        this._ensureOriginalColorsSnapshot();

        const arr = colorAttr.array;
        const totalV = this.vertices.count || arr.length / 4;

        // vReceived: forward edge of what the controller has acked (the end of
        // the yellow band). frameIndex was set to `received` by setFrameIndex.
        const vReceived = Math.min(
            Number(this.frames[this.frameIndex]) || 0,
            totalV,
        );
        // Estimate boundary: gSender's wall-clock per-line countdown. Used only
        // as the fallback floor when there's no reported machine position.
        const estLine = Math.max(0, currentLineRunning - 1);
        const vEstRaw = Math.min(Number(this.frames[estLine]) || 0, totalV);

        // vCutter: grey/orange split = floor vertex at/behind the toolhead.
        // Found by a NEAREST-SEGMENT scan over [floor, received): point-to-
        // SEGMENT distance (not nearest-vertex) keeps it on the tool's own
        // segment on back-and-forth paths, since a parallel pass is a stepover
        // away. Scanning from the floor self-heals; the result is clamped
        // monotonic so the grey edge never retreats.
        const greyEnd = Math.min(this._progGreyEndV || 0, totalV);
        const srcPos = this.vertices.array;
        let vCutter = greyEnd;
        // Whether the toolhead is close enough to an in-flight segment for the
        // split to track it (false while jogging off the path → freeze).
        let cutterNear = true;
        if (cutterPos && srcPos && vReceived > greyEnd) {
            // Geometry duplicates every point, so i+1 is often a zero-length
            // joint; nextDistinct skips to the next distinct vertex.
            const sameXYZ = (i, j) =>
                srcPos[i * 3] === srcPos[j * 3] &&
                srcPos[i * 3 + 1] === srcPos[j * 3 + 1] &&
                srcPos[i * 3 + 2] === srcPos[j * 3 + 2];
            const nextDistinct = (i) => {
                let j = i + 1;
                while (j < vReceived && sameXYZ(j, i)) j++;
                return j;
            };
            // Clamped squared distance from the tool to segment [p, q].
            const segDistSq = (p, q) => {
                const ax = srcPos[p * 3];
                const ay = srcPos[p * 3 + 1];
                const az = srcPos[p * 3 + 2];
                const ex = srcPos[q * 3] - ax;
                const ey = srcPos[q * 3 + 1] - ay;
                const ez = srcPos[q * 3 + 2] - az;
                const len2 = ex * ex + ey * ey + ez * ez;
                let t =
                    len2 > 0
                        ? ((cutterPos.x - ax) * ex +
                              (cutterPos.y - ay) * ey +
                              (cutterPos.z - az) * ez) /
                          len2
                        : 0;
                if (t < 0) t = 0;
                else if (t > 1) t = 1;
                const dx = ax + t * ex - cutterPos.x;
                const dy = ay + t * ey - cutterPos.y;
                const dz = az + t * ez - cutterPos.z;
                return dx * dx + dy * dy + dz * dz;
            };
            let bestS = greyEnd;
            let bestD = Infinity;
            let p = greyEnd;
            let guard = 0;
            while (p < vReceived - 1 && guard++ < 100000) {
                const q = nextDistinct(p); // real segment [p, q]
                if (q >= vReceived) break;
                const d = segDistSq(p, q);
                if (d < bestD) {
                    bestD = d;
                    bestS = p;
                }
                p = q;
            }
            // Only track when the toolhead is near the path; off-path (jogging)
            // hold the last progress. bestD is a squared distance.
            if (bestD <= PROGRESS_NEAR_MM * PROGRESS_NEAR_MM) {
                vCutter = bestS;
            } else {
                vCutter = greyEnd;
                cutterNear = false;
            }
        } else if (!cutterPos) {
            // No machine position — fall back to the estimate boundary so grey
            // ends at gSender's progress line and orange leads from there.
            vCutter = Math.min(vEstRaw, vReceived);
        }
        vCutter = Math.max(greyEnd, Math.min(vCutter, vReceived));

        const opacity = this.isLaser ? 1 : 0.3;
        const grey = new THREE.Color(SECONDARY_COLOR);
        // In laser mode the planned color is red, so orange lead blends in — use
        // cyan for strong contrast against red.
        const PROGRESS_LEAD_COLOR_LASER = '#00ffff'; // cyan
        const progressLead = this.isLaser
            ? new THREE.Color(PROGRESS_LEAD_COLOR_LASER)
            : new THREE.Color(PROGRESS_LEAD_COLOR);
        const yellow = this._plannedColor();
        const src = this.originalColors;

        // vFwd = next vertex with a position DISTINCT from vCutter (skip the
        // duplicate joints), so the overlay has a real segment to split on and
        // orange starts right at the marker. aheadColor is orange when there's
        // any buffered lead, else yellow.
        let vFwd = vCutter + 1;
        while (
            vFwd < vReceived &&
            srcPos[vFwd * 3] === srcPos[vCutter * 3] &&
            srcPos[vFwd * 3 + 1] === srcPos[vCutter * 3 + 1] &&
            srcPos[vFwd * 3 + 2] === srcPos[vCutter * 3 + 2]
        ) {
            vFwd++;
        }
        const aheadColor = vReceived > vCutter ? progressLead : yellow;
        // Lead end: walk ~LEAD_MM of path travel ahead (arc length, not
        // vertex count), capped at received. [vFwd,vLeadEnd) lead color, rest yellow.
        const LEAD_MM = 20;
        const cumLen = this._ensureCumLen();
        let vLeadEnd = vFwd;
        if (cumLen) {
            const baseLen = cumLen[Math.min(vCutter, totalV - 1)];
            while (
                vLeadEnd < vReceived &&
                cumLen[Math.min(vLeadEnd, totalV - 1)] - baseLen < LEAD_MM
            ) {
                vLeadEnd++;
            }
        } else {
            vLeadEnd = vReceived;
        }
        vLeadEnd = Math.max(vFwd, Math.min(vLeadEnd, vReceived));

        const paint = (vStart, vEnd, c, a) => {
            for (let v = Math.max(0, vStart); v < vEnd; v++) {
                const off = v * 4;
                arr[off] = c.r;
                arr[off + 1] = c.g;
                arr[off + 2] = c.b;
                arr[off + 3] = a;
            }
        };
        const restore = (vStart, vEnd) => {
            if (!src) return;
            for (let v = Math.max(0, vStart); v < vEnd; v++) {
                const off = v * 4;
                arr[off] = src[off];
                arr[off + 1] = src[off + 1];
                arr[off + 2] = src[off + 2];
                arr[off + 3] = src[off + 3];
            }
        };

        const hideProc = this.hideProcessedLines;
        const prevAheadEnd = this._progAheadEndV || 0;
        if (hideProc) {
            // "Hide processed lines": only the EXECUTED span [0, vFwd) goes
            // invisible (alpha 0 — the line material honors per-vertex alpha,
            // so this hides reliably in both spindle and laser modes). The
            // run-progress bands ahead of the toolhead stay visible: orange
            // lead, then yellow for the rest of the buffered range. Painted in
            // full every frame so the executed path can never show through;
            // setHideProcessedLines() restores originals when hiding turns off.
            paint(0, vFwd, grey, 0);
            paint(vFwd, vLeadEnd, progressLead, 1);
            paint(vLeadEnd, vReceived, yellow, 1);
            if (prevAheadEnd > vReceived) {
                restore(vReceived, prevAheadEnd);
            }
            // Crisp boundary under the marker: executed half invisible
            // (alpha 0), ahead half still drawn so orange starts exactly at
            // the toolhead.
            if (cutterNear) {
                this._updateProgressSplit(
                    vCutter,
                    vFwd,
                    cutterPos,
                    grey,
                    0,
                    aheadColor,
                );
            }
        } else {
            // GREY [greyEnd, vFwd): extend the executed range (incremental, so cost
            // is bounded). The tool's segment is painted grey here and redrawn
            // crisply by the overlay below.
            paint(greyEnd, vFwd, grey, opacity);
            // Orange/Purple lead [vFwd, vLeadEnd) ahead of the cutter (purple in laser
            // mode for contrast against red toolpath). Beyond received the path keeps
            // its planned color.
            paint(vFwd, vLeadEnd, progressLead, 1);
            paint(vLeadEnd, vReceived, yellow, 1);
            // If the acked edge moved backward since last frame (rare — rewind is
            // normally caught in setFrameIndex), restore the abandoned tail to its
            // original motion colors.
            if (prevAheadEnd > vReceived) {
                restore(vReceived, prevAheadEnd);
            }
            // Redraw the crisp split under the marker — only when near the path;
            // off-path (jogging) leave the overlay frozen at the last split.
            if (cutterNear) {
                this._updateProgressSplit(
                    vCutter,
                    vFwd,
                    cutterPos,
                    grey,
                    opacity,
                    aheadColor,
                );
            }
        }

        this._progGreyEndV = vCutter;
        this._progAheadEndV = vReceived;
        this.oldFrameIndex = Math.max(0, currentLineRunning - 1);

        const updStart = hideProc ? 0 : Math.max(0, greyEnd);
        const updEnd = Math.max(vReceived, prevAheadEnd);
        if (updEnd > updStart) {
            colorAttr.addUpdateRange({
                start: updStart * 4,
                count: (updEnd - updStart) * 4,
            });
            colorAttr.needsUpdate = true;
        }
    }

    /**
     * Hide processed vertices [0, vertexIndex) by setting their per-vertex alpha to 0.
     * Alpha is honored by the line material, so this reliably stops them rendering in
     * BOTH spindle and laser modes (drawRange alone does not visually hide a THREE.Line).
     * Runs every frame from setFrameIndex, so it's independent of run-progress / sender
     * status. setHideProcessedLines() restores the original colors when hiding turns off.
     * @param {number} vertexIndex - The index up to which vertices should be hidden
     */
    _hideProcessedVertices(vertexIndex) {
        const workpiece = this.group.children[0];
        if (!workpiece) return;

        const totalVertices = this.vertices.count;
        const remainingCount = totalVertices - vertexIndex;

        // Keep the drawRange too (cheap; helps where it does apply).
        if (remainingCount > 0) {
            this.geometry.setDrawRange(vertexIndex, remainingCount);
        }

        // Make the processed span invisible via alpha — the reliable, mode-independent hide.
        this._ensureOriginalColorsSnapshot();
        const colorAttr = workpiece.geometry.getAttribute('color');
        if (colorAttr && colorAttr.array && vertexIndex > 0) {
            const arr = colorAttr.array;
            const end = Math.min(vertexIndex, totalVertices);
            for (let v = 0; v < end; v++) {
                arr[v * 4 + 3] = 0;
            }
            colorAttr.addUpdateRange({ start: 0, count: end * 4 });
            colorAttr.needsUpdate = true;
        }
    }

    /**
     * Toggle hiding of processed lines
     * @param {boolean} hide - Whether to hide processed lines
     */
    setHideProcessedLines(hide) {
        const wasHiding = this.hideProcessedLines;
        this.hideProcessedLines = hide;

        if (!hide) {
            const workpiece = this.group.children[0];
            if (workpiece && this.geometry) {
                this.geometry.setDrawRange(0, Infinity);
            }
            // Coming out of hiding (e.g. on job end): the executed span was painted with
            // alpha 0 to hide it, so restore the toolpath's original colors — otherwise it
            // would stay invisible. Also rewind the run-progress edges so a re-run repaints
            // from the start.
            if (wasHiding && this.originalColors && workpiece) {
                const colorAttr = workpiece.geometry.getAttribute('color');
                if (colorAttr && colorAttr.array) {
                    colorAttr.array.set(this.originalColors);
                    colorAttr.needsUpdate = true;
                }
                this._progGreyEndV = 0;
                this._progAheadEndV = 0;
            }
        }
    }

    getCurrentLocation() {
        const offset = this.frames[this.frameIndex] * 3; // Reconvert back to offset
        return {
            x: this.vertices.array[offset],
            y: this.vertices.array[offset + 1],
            z: this.vertices.array[offset + 2],
        };
    }

    unload() {
        if (this._progSplitLine) {
            this._progSplitMaterial?.dispose();
            this._progSplitGeometry?.dispose();
            this._progSplitLine = null;
            this._progSplitMaterial = null;
            this._progSplitGeometry = null;
            this._progSplitPositions = null;
            this._progSplitColors = null;
        }
        this.geometry.dispose();
        this.group.clear();

        this.group = new THREE.Object3D();
        this.geometry = new THREE.BufferGeometry();
        this.vertices = null;
        this.colors = null;
        this.originalColors = null;
        this.frames = null;
        this.frameIndex = 0;
        this.framesLength = 0;
        this.oldFrameIndex = null;
        this.plannedColorArray = [];
        this.plannedV1 = null;
        this.plannedState = STATES.START;
        this._progGreyEndV = 0;
        this._progAheadEndV = 0;
        this._cumLen = null;
        // --rotary
        this.frameDifferences = Array(16).fill(null);
        this.oldV1s = Array(16).fill(null);
        this.countdown = 16;
        // rotary--
    }

    getHull() {
        const vertices = this.geometry.getAttribute('position');
        return vertices.array;
    }
}

export default GCodeVisualizer;
