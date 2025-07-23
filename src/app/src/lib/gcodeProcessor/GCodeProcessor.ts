import objtools from 'objtools';
import Interpreter from 'gcode-interpreter';
import GCodeBlock from '../gcodeProcessor/GCodeBlock';
import { METRIC_UNITS } from '../../constants';
import { BasicType, BBox } from 'app/definitions/general';
import {
    GCodeLine,
    GcodeProcessorOptions,
    SyncMachineOptions,
    VMState,
    VMStateInfo,
} from './definitions';
import { MOTION_MODAL } from './definitions';
import { AXES_T } from 'app/features/Axes/definitions';

export const INVALID_GCODE_REGEX =
    /([^NGMXYZIJKFRS%\-?\.?\d+\.?\s])|((G28)|(G29)|(\$H))/gi;

/**
 *
 * https://github.com/CrispyConductor/tightcnc/blob/332a3a67309d5fe258e2d1567f94ac1e172bac47/lib/gcode-vm.js
 *
 */
export class GCodeProcessor {
    options: GcodeProcessorOptions;
    vmState: VMState;
    _lastMoveAxisFeeds: Array<number> = null;
    constructor(options: GcodeProcessorOptions) {
        this.options = options;
        if (!options.maxFeed) {
            options.maxFeed = 1500;
        }

        if (!options.acceleration) {
            options.acceleration = 1800000;
        }

        if (!options.noInit) {
            this.init();
        }
    }

    process(lines = ''): void {
        if (lines.length === 0) {
            return;
        }
        const interpreter = new Interpreter();
        interpreter.loadFromStringSync(lines, (data: GCodeLine) => {
            this.runGcodeLine(data);
        });
    }

    // Gets or sets an axis value in a coordinate array.
    // If value is null, it returns the current value.  If value is numeric, it sets it.
    coord(coords: Array<number>, axis: number | string, value: number): number {
        let axisNum =
            typeof axis === 'number'
                ? axis
                : this.vmState.axisLabels.indexOf(axis.toLowerCase());

        if (axisNum === -1) {
            // throw new Error('Invalid axis ' + axis);
            console.error('Invalid axis ' + axis);
            return 0;
        }

        if (axisNum < 0 || axisNum >= this.vmState.axisLabels.length) {
            // throw new Error('Axis out of bounds ' + axisNum);
            console.error('Axis out of bounds ' + axisNum);
            return 0;
        }
        if (typeof value === 'number') {
            while (axisNum >= coords.length) {
                coords.push(0);
            }
            coords[axisNum] = value;
        } else {
            return coords[axisNum] || 0;
        }

        return 0;
    }

    init(): void {
        this.reset();
    }

    reset(): void {
        (this.vmState.feedrates = new Set()),
            (this.vmState.tools = new Set()),
            (this.vmState.spindleRates = new Set()),
            (this.vmState.invalidGcode = new Set()),
            this.syncStateToMachine();
        this.vmState.coord = this.coord.bind(this);
        this.vmState.totalTime = 0; // seconds
        this.vmState.bounds = [
            this.zerocoord(null) as Array<number>,
            this.zerocoord(null) as Array<number>,
        ]; // min and max points
        this.vmState.mbounds = [
            this.zerocoord(null) as Array<number>,
            this.zerocoord(null) as Array<number>,
        ]; // bounds for machine coordinates
        this.vmState.lineCounter = 0;
        this.vmState.hasMovedToAxes = this.zerocoord(false) as Array<boolean>; // true for each axis that we've moved on, and have a definite position for
        this.vmState.seenWordSet = {}; // a mapping from word letters to boolean true if that word has been seen at least once
        this.vmState.usedAxes = new Set();

        this.vmState.tool = null;
        this.vmState.countT = 0;
        this.vmState.countM6 = 0;
    }

    getBBox(returnMBounds = false): BBox {
        const [minBounds, maxBounds] = returnMBounds
            ? this.vmState.mbounds
            : this.vmState.bounds;
        const [minX, minY, minZ] = minBounds;
        const [maxX, maxY, maxZ] = maxBounds;

        return {
            min: {
                x: minX,
                y: minY,
                z: minZ,
            },
            max: {
                x: maxX,
                y: maxY,
                z: maxZ,
            },
            delta: {
                x: maxX - minX,
                y: maxY - minY,
                z: maxZ - minZ,
            },
        };
    }

    syncStateToMachine(options?: SyncMachineOptions): void {
        const shouldInclude = (prop: string): boolean => {
            if (!options.include && !options.exclude) {
                return true;
            }
            if (
                options.include &&
                options.exclude &&
                options.include.indexOf(prop) !== -1 &&
                options.exclude.indexOf(prop) === -1
            ) {
                return true;
            }
            if (
                !options.include &&
                options.exclude &&
                options.exclude.indexOf(prop) === -1
            ) {
                return true;
            }
            if (
                options.include &&
                !options.exclude &&
                options.include.indexOf(prop) !== -1
            ) {
                return true;
            }
            return false;
        };

        let controller = options.controller ||
            this.options.controller ||
            (this.options.tightcnc && this.options.tightcnc.controller) || {
                mpos: null,
                getPos: null,
                activeCoordSys: null,
                coordSysOffsets: null,
                offset: null,
                offsetEnabled: null,
                storedPositions: null,
                units: null,
                feed: null,
                incremental: null,
                coolant: null,
                spindle: null,
                line: null,
                spindleDirection: null,
                spindleSpeed: null,
                inverseFeed: null,
                motionMode: null,
                arcPlane: null,
                tool: null,
                axisLabels: null,
                pos: null,
            };
        let vmState = options.vmState || this.vmState;

        if (shouldInclude('axisLabels')) {
            vmState.axisLabels = objtools.deepCopy(
                this.options.axisLabels ||
                    controller.axisLabels || ['x', 'y', 'z'],
            );
        }
        if (shouldInclude('mpos')) {
            vmState.mpos = objtools.deepCopy(
                controller.mpos || this.zerocoord(),
            );
        }
        if (shouldInclude('pos')) {
            vmState.pos = objtools.deepCopy(
                (controller.getPos && controller.getPos()) ||
                    controller.pos ||
                    this.zerocoord(),
            );
        }
        if (shouldInclude('activeCoordSys')) {
            vmState.activeCoordSys =
                typeof controller.activeCoordSys === 'number'
                    ? controller.activeCoordSys
                    : null;
        }
        if (shouldInclude('coordSysOffsets')) {
            vmState.coordSysOffsets = objtools.deepCopy(
                controller.coordSysOffsets || [this.zerocoord()],
            );
        }
        if (shouldInclude('offset')) {
            vmState.offset =
                controller.offset || (this.zerocoord() as Array<number>);
        }
        if (shouldInclude('offsetEnabled')) {
            vmState.offsetEnabled = controller.offsetEnabled || false;
        }
        if (shouldInclude('storedPositions')) {
            vmState.storedPositions = objtools.deepCopy(
                controller.storedPositions || [
                    this.zerocoord(),
                    this.zerocoord(),
                ],
            );
        }
        if (shouldInclude('units')) {
            vmState.units = controller.units || METRIC_UNITS;
        }
        if (shouldInclude('feed')) {
            vmState.feed =
                controller.feed ||
                (Array.isArray(this.options.maxFeed)
                    ? this.options.maxFeed[0]
                    : this.options.maxFeed);
        }
        if (shouldInclude('incremental')) {
            vmState.incremental = controller.incremental || false;
        }
        if (shouldInclude('coolant')) {
            vmState.coolant = controller.coolant || 0;
        }
        if (shouldInclude('spindle')) {
            vmState.spindle = controller.spindle || false;
        }
        if (shouldInclude('line')) {
            vmState.line = controller.line || 0;
        }
        if (shouldInclude('spindle')) {
            vmState.spindleDirection = controller.spindleDirection || 1;
        }
        if (shouldInclude('spindle')) {
            vmState.spindleSpeed = controller.spindleSpeed || null;
        }
        if (shouldInclude('inverseFeed')) {
            vmState.inverseFeed = controller.inverseFeed || false;
        }
        if (shouldInclude('motionMode')) {
            vmState.motionMode = controller.motionMode || null;
        }
        if (shouldInclude('arcPlane')) {
            vmState.arcPlane = controller.arcPlane || 0;
        }
        if (shouldInclude('tool')) {
            vmState.tool =
                controller.tool !== null && controller.tool !== undefined
                    ? controller.tool
                    : null;
        }
    }

    _setCoordSys(num: number): void {
        this.vmState.pos = this._convertCoordSys(
            this.vmState.pos,
            this.vmState.activeCoordSys,
            num,
            null,
            null,
        ); // note, offsets from vmState.offset are cancelled out so don't need to be passed
        this.vmState.activeCoordSys = num;
    }

    runGcodeLine({ line, words }: GCodeLine): VMStateInfo {
        // This is NOT a gcode validator.  Input gcode is expected to be valid and well-formed.
        if (words.length === 0) {
            return null;
        }
        let gline = new GCodeBlock(words, line);
        let vmState = this.vmState;
        let origCoordSys = vmState.activeCoordSys;
        let origTotalTime = vmState.totalTime;
        let changedCoordOffsets = false;

        // Determine if this line represents motion
        let motionCode: BasicType = null; // The G code on this line in the motion modal group (indicating some kind of machine motion)
        let hasCoords: Array<AXES_T> = []; // A list of axis word letters present (eg. [ 'X', 'Z' ])
        let coordPos: Array<number> = vmState.incremental
            ? (this.zerocoord() as Array<number>)
            : objtools.deepCopy(vmState.pos); // Position indicated by coordinates present, filling in missing ones with current pos; unless incremental, then all zeroes
        let coordPosSparse = this.zerocoord(null) as Array<number>; // Position indicated by coordinates present, with missing axes filled in with nulls
        let coordFlags = this.zerocoord(false) as Array<boolean>; // True in positions where coordinates are present

        // Determine which axis words are present and convert to coordinate arrays
        for (let axisNum = 0; axisNum < vmState.axisLabels.length; axisNum++) {
            let axis = vmState.axisLabels[axisNum].toUpperCase();
            let val = gline.get(axis);
            if (typeof val === 'number') {
                hasCoords.push(axis);
                coordPos[axisNum] = val;
                coordPosSparse[axisNum] = val;
                coordFlags[axisNum] = true;
                this.vmState.usedAxes.add(axis);
            }
            if (gline.has(axis)) {
                hasCoords.push(axis);
            }
        }

        // Check if a motion gcode is indicated (either by presence of a motion gcode word, or presence of coordinates without any other gcode)
        if (!gline.hasLetter('G') && hasCoords.length) {
            motionCode = vmState.motionMode;
        } else {
            motionCode = gline.getLetter('G');
            if (typeof motionCode === 'number') {
                motionCode = 'G' + motionCode;
                vmState.motionMode = motionCode as MOTION_MODAL;
            }
        }

        // Check if this is simple motion that can skip extra checks (for efficiency in the most common case)
        //let isSimpleMotion = motionCode && (motionCode === 'G0' || motionCode === 'G1') && (gline.has(motionCode) ? 1 : 0) + (gline.has('F') ? 1 : 0) + (gline.has('N') ? 1 : 0);
        let isSimpleMotion = gline.isSimpleMotion();
        // Update seenWordSet
        for (let word of gline.words) {
            vmState.seenWordSet[word[0]] = true;
        }

        console.log('testing');
        if (INVALID_GCODE_REGEX.test(gline.asString())) {
            vmState.invalidGcode.add(gline.asString());
        }

        // Check for other codes that set modals
        let tempCoordSys = false;
        let wordF = gline.get('F');
        if (typeof wordF === 'number') {
            vmState.feed = wordF;
            vmState.feedrates.add('F' + wordF);
        }
        if (!isSimpleMotion) {
            if (gline.has('G17')) {
                vmState.arcPlane = 0;
            }
            if (gline.has('G18')) {
                vmState.arcPlane = 1;
            }
            if (gline.has('G19')) {
                vmState.arcPlane = 2;
            }
            if (gline.has('G20')) {
                vmState.units = 'in';
            }
            if (gline.has('G21')) {
                vmState.units = METRIC_UNITS;
            }
            for (let i = 0; i < 6; i++) {
                if (gline.has('G' + (54 + i))) {
                    this._setCoordSys(i);
                    changedCoordOffsets = true;
                }
            }
            if (gline.has('G80')) {
                vmState.motionMode = null;
            }
            if (gline.has('G90')) {
                vmState.incremental = false;
            }
            if (gline.has('G91')) {
                vmState.incremental = true;
            }
            if (gline.has('G93')) {
                vmState.inverseFeed = true;
            }
            if (gline.has('G94')) {
                vmState.inverseFeed = false;
            }
            if (gline.has('M2') || gline.has('M30')) {
                vmState.offset = this.zerocoord() as Array<number>;
                vmState.offsetEnabled = false;
                vmState.activeCoordSys = 0;
                vmState.arcPlane = 0;
                vmState.incremental = false;
                vmState.inverseFeed = false;
                vmState.spindle = false;
                vmState.motionMode = null;
                vmState.coolant = 0;
                vmState.units = METRIC_UNITS;
                changedCoordOffsets = true;
            }
            let wordS = gline.get('S');
            if (typeof wordS === 'number') {
                vmState.spindleSpeed = wordS;
                vmState.spindleRates.add('S' + wordS);
            }
            if (gline.has('M3')) {
                vmState.spindleDirection = 1;
                vmState.spindle = true;
            }
            if (gline.has('M4')) {
                vmState.spindleDirection = -1;
                vmState.spindle = true;
            }
            if (gline.has('M5')) {
                vmState.spindle = false;
            }
            if (gline.has('M7')) {
                if (vmState.coolant === 2) {
                    vmState.coolant = 3;
                } else {
                    vmState.coolant = 1;
                }
            }
            if (gline.has('M8')) {
                if (vmState.coolant === 1) {
                    vmState.coolant = 3;
                } else {
                    vmState.coolant = 2;
                }
            }
            if (gline.has('M9')) {
                vmState.coolant = 0;
            }

            // Check if temporary G53 coordinates are in effect
            if (gline.has('G53')) {
                tempCoordSys = true;
                this._setCoordSys(null);
            }
        }

        // Handle motion
        let doMotion = motionCode;
        let isMotion = false;
        if (!isSimpleMotion) {
            if (gline.has('G28')) {
                doMotion = 'G28';
            }
            if (gline.has('G30')) {
                doMotion = 'G30';
            }
        }
        if (doMotion === 'G0') {
            if (hasCoords.length) {
                this._processMove(
                    coordPos,
                    coordFlags,
                    null,
                    null,
                    vmState.incremental,
                );
                isMotion = true;
            }
        } else if (doMotion === 'G1') {
            if (hasCoords.length) {
                this._processMove(
                    coordPos,
                    coordFlags,
                    vmState.feed,
                    null,
                    vmState.incremental,
                );
                isMotion = true;
            }
        } else if (doMotion === 'G2' || doMotion === 'G3') {
            if (hasCoords.length) {
                // TODO: calculate travel distance properly here
                this._processMove(
                    coordPos,
                    coordFlags,
                    vmState.feed,
                    null,
                    vmState.incremental,
                );
                isMotion = true;
            }
        } else if (doMotion === 'G28' || doMotion === 'G30') {
            if (hasCoords.length) {
                this._processMove(
                    coordPos,
                    coordFlags,
                    vmState.feed,
                    null,
                    vmState.incremental,
                );
            }
            let storedPos = vmState.storedPositions[doMotion === 'G28' ? 0 : 1];
            storedPos = this._convertCoordSys(
                storedPos,
                null,
                vmState.activeCoordSys,
                null,
                vmState.offsetEnabled && vmState.offset,
            );
            this._processMove(storedPos, null, vmState.feed, null, false);
            isMotion = true;
        } else if (doMotion) {
            console.error('Invalid motion detected');
        }

        if (!isSimpleMotion) {
            // Handle G10 L2
            if (
                gline.has('G10') &&
                gline.has('L2') &&
                gline.has('P') &&
                hasCoords.length
            ) {
                this._updateMPosFromPos();
                let newOffset = coordPosSparse.map((v) => v || 0);
                let coordSys = (gline.get('P') as number) - 1;
                vmState.coordSysOffsets[coordSys] = newOffset;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            // Handle G10 L20
            if (
                gline.has('G10') &&
                gline.has('L20') &&
                gline.has('P') &&
                hasCoords.length
            ) {
                this._updateMPosFromPos();
                let newOffset = coordPosSparse
                    .map((v) => v || 0)
                    .map((v, i) => (vmState.mpos[i] || 0) - v);
                let coordSys = (gline.get('P') as number) - 1;
                vmState.coordSysOffsets[coordSys] = newOffset;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }

            // Handle G28.1
            if (gline.has('G28.1')) {
                vmState.storedPositions[0] = objtools.deepCopy(vmState.mpos);
            }
            if (gline.has('G30.1')) {
                vmState.storedPositions[1] = objtools.deepCopy(vmState.mpos);
            }

            // Handle homing (can't really be handled exactly correctly without knowing actual machine position)
            if (gline.has('G28.2') || gline.has('G28.3')) {
                for (
                    let axisNum = 0;
                    axisNum < coordPosSparse.length;
                    axisNum++
                ) {
                    if (coordPosSparse[axisNum] !== null) {
                        vmState.mpos[axisNum] = 0;
                    }
                }
                changedCoordOffsets = true;
            }

            // Handle G92
            if (gline.has('G92')) {
                this._updateMPosFromPos();
                vmState.offset = coordPosSparse.map((v) => v || 0);
                vmState.offsetEnabled = true;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            if (gline.has('G92.1')) {
                this._updateMPosFromPos();
                vmState.offset = this.zerocoord() as Array<number>;
                vmState.offsetEnabled = false;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            if (gline.has('G92.2')) {
                this._updateMPosFromPos();
                vmState.offsetEnabled = false;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            if (gline.has('G92.3')) {
                this._updateMPosFromPos();
                vmState.offsetEnabled = true;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            // Handle dwell
            if (gline.has('G4') && gline.has('P')) {
                vmState.totalTime += gline.get('P') as number;
            }

            // Handle T
            if (gline.has('T')) {
                const value = gline.get('T') as string;
                vmState.tool = value;
                vmState.tools.add('T' + value);

                vmState.countT++;
            }
            if (gline.has('M6')) {
                vmState.countM6++;
            }
        }

        // Handle line number
        let lineNum = gline.get('N') as number;
        if (lineNum !== null) {
            vmState.line = lineNum;
        }

        // Add to line counter
        vmState.lineCounter++;

        // Reset coordinate system if using G53
        if (tempCoordSys) {
            this._setCoordSys(origCoordSys);
        }

        // Return state info
        return {
            state: vmState, // VM state after executing line
            isMotion: isMotion, // whether the line represents motion
            motionCode: motionCode, // If motion, the G code associated with the motion
            changedCoordOffsets: changedCoordOffsets, // whether or not anything was changed with coordinate systems
            time: vmState.totalTime - origTotalTime, // estimated duration of instruction execution, in seconds
        };
    }

    _convertCoordSys(
        pos: Array<number>,
        fromCoordSys: number,
        toCoordSys: number,
        fromOffset: Array<number> = null,
        toOffset: Array<number> = null,
    ): Array<number> {
        let vmState = this.vmState;
        let retPos: Array<number> = [];
        for (let axisNum = 0; axisNum < pos.length; axisNum++) {
            let fromTotalOffset = 0;
            let toTotalOffset = 0;
            if (typeof fromCoordSys === 'number') {
                fromTotalOffset +=
                    (vmState.coordSysOffsets[fromCoordSys] || [])[axisNum] || 0;
            }
            if (typeof toCoordSys === 'number') {
                toTotalOffset +=
                    (vmState.coordSysOffsets[toCoordSys] || [])[axisNum] || 0;
            }
            if (fromOffset) {
                fromTotalOffset += fromOffset[axisNum] || 0;
            }
            if (toOffset) {
                toTotalOffset += toOffset[axisNum] || 0;
            }
            retPos.push((pos[axisNum] || 0) + fromTotalOffset - toTotalOffset);
        }
        return retPos;
    }

    _updateMPosFromPos(): void {
        this.vmState.mpos = this._convertCoordSys(
            this.vmState.pos,
            this.vmState.activeCoordSys,
            null,
            this.vmState.offsetEnabled && this.vmState.offset,
            null,
        );
    }

    _updatePosFromMPos(): void {
        this.vmState.pos = this._convertCoordSys(
            this.vmState.mpos,
            null,
            this.vmState.activeCoordSys,
            null,
            this.vmState.offsetEnabled && this.vmState.offset,
        );
    }

    _updateBounds(
        bounds: Array<Array<number>>,
        pos: Array<number>,
        axisFlags: Array<boolean>,
    ): void {
        for (let axisNum = 0; axisNum < pos.length; axisNum++) {
            let v = pos[axisNum];
            if (typeof v !== 'number' || (axisFlags && !axisFlags[axisNum])) {
                continue;
            }
            if (bounds[0][axisNum] === null || v < bounds[0][axisNum]) {
                bounds[0][axisNum] = v;
            }
            if (bounds[1][axisNum] === null || v > bounds[1][axisNum]) {
                bounds[1][axisNum] = v;
            }
        }
    }

    getAxisValue(axis: string): number | string {
        return axis ? Number(axis.slice(1)) : '';
    }

    zerocoord(val: number | boolean = 0): Array<number | boolean> {
        let coords: Array<number | boolean> = [];
        for (let i = 0; i < this.vmState.axisLabels.length; i++) {
            coords.push(val);
        }
        return coords;
    }

    _processMove(
        to: Array<number>,
        axisFlags: Array<boolean>,
        feed: number = null,
        travel: number = null,
        incremental = false,
    ): void {
        if (incremental) {
            // Update pos if incremental coordinates
            for (
                let axisNum = 0;
                axisNum < this.vmState.pos.length;
                axisNum++
            ) {
                to = objtools.deepCopy(to);
            }
        }
        // Calculate distance travelled if not provided
        if (travel === null) {
            let travelSq = 0;
            for (
                let axisNum = 0;
                axisNum < this.vmState.pos.length;
                axisNum++
            ) {
                if (to[axisNum] === null || to[axisNum] === undefined) {
                    to[axisNum] = this.vmState.pos[axisNum];
                }
                travelSq += Math.pow(
                    (to[axisNum] || 0) - (this.vmState.pos[axisNum] || 0),
                    2,
                );
            }
            travel = Math.sqrt(travelSq);
        }
        let from = this.vmState.pos;
        let moveTime: number;
        if (this.vmState.inverseFeed && feed) {
            // Handle time calc if inverse feed
            // Calculate the minimum amount of time this move would take so we can compare it to the requested time
            let minTime = 0;
            for (
                let axisNum = 0;
                axisNum < to.length && axisNum < from.length;
                axisNum++
            ) {
                let axisTravel = Math.abs(from[axisNum] - to[axisNum]);
                let axisFeed = Array.isArray(this.options.maxFeed)
                    ? this.options.maxFeed[axisNum]
                    : this.options.maxFeed;
                let travelTime = (axisTravel / (axisFeed || 1000)) * 60;
                if (travelTime > minTime) {
                    minTime = travelTime;
                }
            }
            // Calculate move time
            let moveTime = 60 / feed;
            if (moveTime < minTime) {
                moveTime = minTime;
            }
        } else {
            //moveTime = (travel / feed) * 60; // <-- naive (infinite acceleration) move time calculation
            // NOTE: The below code to account for acceleration could certainly be improved; but to large extent, it's
            // actually controller-specific.  The accuracy of these time estimates will vary.
            // Approximate move time (making a few not necessarily true assumptions) is calculated by
            // starting with the move's time if it were operating at the full feed rate the whole time (infinite acceleration),
            // then deducting the extra time it would have taken to change from the previous move's feed to this move's feed.
            // This is calculated on a per-axis basis, taking the per-axis components of the feed rate.
            if (!this._lastMoveAxisFeeds) {
                this._lastMoveAxisFeeds = this.zerocoord() as Array<number>;
            }
            // calculate linear distance travelled (this, and other parts of this method, will need to be adjusted for nonlinear moves)
            let linearDist = 0;
            for (let axisNum = 0; axisNum < to.length; axisNum++) {
                let d = to[axisNum] - this.vmState.pos[axisNum];
                linearDist += d * d;
            }
            linearDist = Math.sqrt(linearDist);
            // Determine the axis that will require the most amount of time to change velocity
            let maxAccelTime = 0; // minutes
            let axisAccelTimes = [];
            let accelMin = null;
            for (let axisNum = 0; axisNum < to.length; axisNum++) {
                let accel = Array.isArray(this.options.acceleration)
                    ? this.options.acceleration[axisNum]
                    : this.options.acceleration;
                if (accelMin === null || accel < accelMin) {
                    accelMin = accel;
                }
                let diff = to[axisNum] - this.vmState.pos[axisNum];
                // calculate feed component for this axis (may be negative to indicate negative direction)
                let axisFeed: number;
                if (!feed) {
                    // G0
                    axisFeed = Array.isArray(this.options.maxFeed)
                        ? this.options.maxFeed[axisNum]
                        : this.options.maxFeed;
                } else {
                    axisFeed = (diff / linearDist) * feed; // in units/min
                }
                // Get and update the last move's axis feed rate
                let lastMoveAxisFeed = this._lastMoveAxisFeeds[axisNum];
                this._lastMoveAxisFeeds[axisNum] = axisFeed;
                // calculate amount of time it would take to accelerate between the feeds
                let accelTime = Math.abs(axisFeed - lastMoveAxisFeed) / accel; // min
                if (accelTime > maxAccelTime) {
                    maxAccelTime = accelTime;
                }
                axisAccelTimes[axisNum] = accelTime;
            }
            // Determine the distance travelled for that acceleration time
            let accelDist = Math.abs(
                (1 / 2) * accelMin * (maxAccelTime * maxAccelTime),
            );
            if (accelDist > travel) {
                accelDist = travel;
            }
            // Calcualate the base move time (time when travelling over move at max feed, minus the distances for acceleration)
            if (!feed) {
                // G0
                moveTime = 0;
                for (
                    let axisNum = 0;
                    axisNum < to.length && axisNum < from.length;
                    axisNum++
                ) {
                    let accel = Array.isArray(this.options.acceleration)
                        ? this.options.acceleration[axisNum]
                        : this.options.acceleration;
                    let axisAccelTime = axisAccelTimes[axisNum];
                    let axisAccelDist = Math.abs(
                        (1 / 2) * accel * (axisAccelTime * axisAccelTime),
                    );
                    let axisTravel = Math.abs(
                        to[axisNum] - this.vmState.pos[axisNum],
                    );
                    if (axisAccelDist > axisTravel) {
                        axisAccelDist = axisTravel;
                    }
                    axisTravel -= axisAccelDist;
                    let axisFeed = Array.isArray(this.options.maxFeed)
                        ? this.options.maxFeed[axisNum]
                        : this.options.maxFeed;
                    let travelTime = axisTravel / (axisFeed || 1000); // minutes
                    travelTime += axisAccelTime;
                    if (travelTime > moveTime) {
                        moveTime = travelTime;
                    }
                }
            } else {
                moveTime = (travel - accelDist) / feed; // minutes
                // Add time to accelerate
                moveTime += maxAccelTime;
            }
            // convert to seconds
            moveTime *= 60;
        }
        if (this.options.minMoveTime && moveTime < this.options.minMoveTime) {
            moveTime = this.options.minMoveTime;
        }
        this.vmState.totalTime += moveTime;
        // Update local coordinates
        for (let axisNum = 0; axisNum < to.length; axisNum++) {
            if (incremental) {
                this.vmState.pos[axisNum] += to[axisNum];
            } else {
                this.vmState.pos[axisNum] = to[axisNum];
            }
        }
        // Update machine position
        this._updateMPosFromPos();
        // Update bounds
        this._updateBounds(this.vmState.bounds, this.vmState.pos, axisFlags);
        this._updateBounds(this.vmState.mbounds, this.vmState.mpos, axisFlags);
        // Update hasMovedToAxes with axes we definitively know positions for
        if (!incremental && axisFlags) {
            for (let axisNum = 0; axisNum < axisFlags.length; axisNum++) {
                if (axisFlags[axisNum]) {
                    this.vmState.hasMovedToAxes[axisNum] = true;
                }
            }
        }
    }
}
