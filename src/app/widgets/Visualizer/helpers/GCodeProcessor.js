import objtools from 'objtools';
import GcodeLine from './GCodeLine';

export const INVALID_GCODE_REGEX = /([^NGMXYZIJKFRS%\-?\.?\d+\.?\s])|((G28)|(G29)|(\$H))/gi;

/**
 *
 * https://github.com/CrispyConductor/tightcnc/blob/332a3a67309d5fe258e2d1567f94ac1e172bac47/lib/gcode-vm.js
 *
 */
export class GCodeProcessor {
    constructor(options = {}) {
        this.options = options;
        if (!options.maxFeed) {
            options.maxFeed = 1000;
        }

        if (!options.acceleration) {
            options.acceleration = 100000;
        }

        if (!options.noInit) {
            this.init();
        }
    }

    process(lines = []) {
        if (lines.length === 0) {
            return;
        }

        for (const line of lines) {
            this.runGcodeLine(line);
        }
    }

    // Gets or sets an axis value in a coordinate array.
    // If value is null, it returns the current value.  If value is numeric, it sets it.
    coord(coords, axis, value = null) {
        let axisNum = (typeof axis === 'number') ? axis : this.vmState.axisLabels.indexOf(axis.toLowerCase());

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

    init() {
        this.reset();
    }

    reset() {
        let vmState = {
            feedrates: new Set(),
            tools: new Set(),
            spindleRates: new Set(),
            invalidGcode: new Set(),
        };
        this.vmState = vmState;
        this.syncStateToMachine();
        vmState.coord = this.coord.bind(this);
        vmState.totalTime = 0; // seconds
        vmState.bounds = [this.zerocoord(null), this.zerocoord(null)]; // min and max points
        vmState.mbounds = [this.zerocoord(null), this.zerocoord(null)]; // bounds for machine coordinates
        vmState.lineCounter = 0;
        vmState.hasMovedToAxes = this.zerocoord(false); // true for each axis that we've moved on, and have a definite position for
        vmState.seenWordSet = {}; // a mapping from word letters to boolean true if that word has been seen at least once

        vmState.tool = null;
        vmState.countT = 0;
        vmState.countM6 = 0;
    }

    getBBox(returnMBounds = false) {
        const [minBounds, maxBounds] = returnMBounds ? this.vmState.mbounds : this.vmState.bounds;
        const [minX, minY, minZ] = minBounds;
        const [maxX, maxY, maxZ] = maxBounds;
        return {
            min: {
                x: minX,
                y: minY,
                z: minZ
            },
            max: {
                x: maxX,
                y: maxY,
                z: maxZ
            }
        };
    }

    syncStateToMachine(options = {}) {
        const shouldInclude = (prop) => {
            if (!options.include && !options.exclude) {
                return true;
            }
            if (options.include && options.exclude && options.include.indexOf(prop) !== -1 && options.exclude.indexOf(prop) === -1) {
                return true;
            }
            if (!options.include && options.exclude && options.exclude.indexOf(prop) === -1) {
                return true;
            }
            if (options.include && !options.exclude && options.include.indexOf(prop) !== -1) {
                return true;
            }
            return false;
        };

        let controller = options.controller || this.options.controller || (this.options.tightcnc && this.options.tightcnc.controller) || {};
        let vmState = options.vmState || this.vmState;

        if (shouldInclude('axisLabels')) {
            vmState.axisLabels = objtools.deepCopy(this.options.axisLabels || controller.axisLabels || ['x', 'y', 'z']);
        }
        if (shouldInclude('mpos')) {
            vmState.mpos = objtools.deepCopy(controller.mpos || this.zerocoord());
        }
        if (shouldInclude('pos')) {
            vmState.pos = objtools.deepCopy((controller.getPos && controller.getPos()) || controller.pos || this.zerocoord());
        }
        if (shouldInclude('activeCoordSys')) {
            vmState.activeCoordSys = (typeof controller.activeCoordSys === 'number') ? controller.activeCoordSys : null;
        }
        if (shouldInclude('coordSysOffsets')) {
            vmState.coordSysOffsets = objtools.deepCopy(controller.coordSysOffsets || [this.zerocoord()]);
        }
        if (shouldInclude('offset')) {
            vmState.offset = controller.offset || this.zerocoord();
        }
        if (shouldInclude('offsetEnabled')) {
            vmState.offsetEnabled = controller.offsetEnabled || false;
        }
        if (shouldInclude('storedPositions')) {
            vmState.storedPositions = objtools.deepCopy(controller.storedPositions || [this.zerocoord(), this.zerocoord()]);
        }
        if (shouldInclude('units')) {
            vmState.units = controller.units || 'mm';
        }
        if (shouldInclude('feed')) {
            vmState.feed = controller.feed || (Array.isArray(this.options.maxFeed) ? this.options.maxFeed[0] : this.options.maxFeed);
        }
        if (shouldInclude('incremental')) {
            vmState.incremental = controller.incremental || false;
        }
        if (shouldInclude('coolant')) {
            vmState.coolant = controller.coolant || false;
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
            vmState.tool = (controller.tool !== null && controller.tool !== undefined) ? controller.tool : null;
        }
    }

    _setCoordSys(num) {
        this.vmState.pos = this._convertCoordSys(this.vmState.pos, this.vmState.activeCoordSys, num, null, null); // note, offsets from vmState.offset are cancelled out so don't need to be passed
        this.vmState.activeCoordSys = num;
    }

    runGcodeLine(gline) {
        if (typeof gline === 'string') {
            gline = new GcodeLine(gline);
        }
        // This is NOT a gcode validator.  Input gcode is expected to be valid and well-formed.
        //
        let vmState = this.vmState;
        let origCoordSys = vmState.activeCoordSys;
        let origTotalTime = vmState.totalTime;
        let changedCoordOffsets = false;

        // Determine if this line represents motion
        let motionCode = null; // The G code on this line in the motion modal group (indicating some kind of machine motion)
        let hasCoords = []; // A list of axis word letters present (eg. [ 'X', 'Z' ])
        let coordPos = vmState.incremental ? this.zerocoord() : objtools.deepCopy(vmState.pos); // Position indicated by coordinates present, filling in missing ones with current pos; unless incremental, then all zeroes
        let coordPosSparse = this.zerocoord(null); // Position indicated by coordinates present, with missing axes filled in with nulls
        let coordFlags = this.zerocoord(false); // True in positions where coordinates are present

        // Determine which axis words are present and convert to coordinate arrays
        for (let axisNum = 0; axisNum < vmState.axisLabels.length; axisNum++) {
            let axis = vmState.axisLabels[axisNum].toUpperCase();
            let val = gline.get(axis);
            if (typeof val === 'number') {
                hasCoords.push(axis);
                coordPos[axisNum] = val;
                coordPosSparse[axisNum] = val;
                coordFlags[axisNum] = true;
            }
            if (gline.has(axis)) {
                hasCoords.push(axis);
            }
        }

        // Check if a motion gcode is indicated (either by presence of a motion gcode word, or presence of coordinates without any other gcode)
        if (!gline.has('G') && hasCoords.length) {
            motionCode = vmState.motionMode;
        } else {
            motionCode = gline.get('G', 'G0');
            if (typeof motionCode === 'number') {
                motionCode = 'G' + motionCode;
                vmState.motionMode = motionCode;
            }
        }

        // Check if this is simple motion that can skip extra checks (for efficiency in the most common case)
        let isSimpleMotion = motionCode && (motionCode === 'G0' || motionCode === 'G1') && (gline.has(motionCode) ? 1 : 0) + (gline.has('F') ? 1 : 0) + (gline.has('N') ? 1 : 0) + hasCoords.length === gline.words.length;

        // Update seenWordSet
        for (let word of gline.words) {
            vmState.seenWordSet[word[0].toUpperCase()] = true;
        }

        if (INVALID_GCODE_REGEX.test(gline.origLine)) {
            vmState.invalidGcode.add(gline.origLine);
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
                vmState.units = 'mm';
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
                vmState.offset = this.zerocoord();
                vmState.offsetEnabled = false;
                vmState.activeCoordSys = 0;
                vmState.arcPlane = 0;
                vmState.incremental = false;
                vmState.inverseFeed = false;
                vmState.spindle = false;
                vmState.motionMode = null;
                vmState.coolant = false;
                vmState.units = 'mm';
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
                vmState.coolant = false;
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
                this._processMove(coordPos, coordFlags, null, null, vmState.incremental);
                isMotion = true;
            }
        } else if (doMotion === 'G1') {
            if (hasCoords.length) {
                this._processMove(coordPos, coordFlags, vmState.feed, null, vmState.incremental);
                isMotion = true;
            }
        } else if ((doMotion === 'G2' || doMotion === 'G3')) {
            if (hasCoords.length) {
                // TODO: calculate travel distance properly here
                this._processMove(coordPos, coordFlags, vmState.feed, null, vmState.incremental);
                isMotion = true;
            }
        } else if (doMotion === 'G28' || doMotion === 'G30') {
            if (hasCoords.length) {
                this._processMove(coordPos, coordFlags, vmState.feed, null, vmState.incremental);
            }
            let storedPos = vmState.storedPositions[(doMotion === 'G28') ? 0 : 1];
            storedPos = this._convertCoordSys(storedPos, null, vmState.activeCoordSys, null, vmState.offsetEnabled && vmState.offset);
            this._processMove(storedPos, null, vmState.feed, null, false);
            isMotion = true;
        } else if (doMotion) {
            // throw new Error('Unsupported motion gcode ' + doMotion + ': ' + gline.toString());
            console.error('Unsupported motion gcode ' + doMotion + ': ' + gline.toString());
            return {
                state: vmState, // VM state after executing line
                isMotion: isMotion, // whether the line represents motion
                motionCode: motionCode, // If motion, the G code associated with the motion
                changedCoordOffsets: changedCoordOffsets, // whether or not anything was changed with coordinate systems
                time: vmState.totalTime - origTotalTime // estimated duration of instruction execution, in seconds
            };
        }

        if (!isSimpleMotion) {
            // Handle G10 L2
            if (gline.has('G10') && gline.has('L2') && gline.has('P') && hasCoords.length) {
                this._updateMPosFromPos();
                let newOffset = coordPosSparse.map((v) => (v || 0));
                let coordSys = gline.get('P') - 1;
                vmState.coordSysOffsets[coordSys] = newOffset;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            // Handle G10 L20
            if (gline.has('G10') && gline.has('L20') && gline.has('P') && hasCoords.length) {
                this._updateMPosFromPos();
                let newOffset = coordPosSparse.map((v) => (v || 0)).map((v, i) => (vmState.mpos[i] || 0) - v);
                let coordSys = gline.get('P') - 1;
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
                for (let axisNum = 0; axisNum < coordPosSparse.length; axisNum++) {
                    if (coordPosSparse[axisNum] !== null) {
                        vmState.mpos[axisNum] = 0;
                    }
                }
                changedCoordOffsets = true;
            }

            // Handle G92
            if (gline.has('G92')) {
                this._updateMPosFromPos();
                vmState.offset = coordPosSparse.map((v) => (v || 0));
                vmState.offsetEnabled = true;
                this._updatePosFromMPos();
                changedCoordOffsets = true;
            }
            if (gline.has('G92.1')) {
                this._updateMPosFromPos();
                vmState.offset = this.zerocoord();
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
                vmState.totalTime += gline.get('P');
            }

            // Handle T
            if (gline.has('T')) {
                const values = gline.get('T', null, true);
                vmState.tool = values[0];

                for (const val of values) {
                    vmState.tools.add('T' + val);
                }

                vmState.countT++;
            }
            if (gline.has('M6')) {
                vmState.countM6++;
            }
        }

        // Handle line number
        let lineNum = gline.get('N');
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
            time: vmState.totalTime - origTotalTime // estimated duration of instruction execution, in seconds
        };
    }

    _convertCoordSys(pos, fromCoordSys, toCoordSys, fromOffset = null, toOffset = null) {
        let vmState = this.vmState;
        let retPos = [];
        for (let axisNum = 0; axisNum < pos.length; axisNum++) {
            let fromTotalOffset = 0;
            let toTotalOffset = 0;
            if (typeof fromCoordSys === 'number') {
                fromTotalOffset += (vmState.coordSysOffsets[fromCoordSys] || [])[axisNum] || 0;
            }
            if (typeof toCoordSys === 'number') {
                toTotalOffset += (vmState.coordSysOffsets[toCoordSys] || [])[axisNum] || 0;
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

    _updateMPosFromPos() {
        this.vmState.mpos = this._convertCoordSys(this.vmState.pos, this.vmState.activeCoordSys, null, this.vmState.offsetEnabled && this.vmState.offset, null);
    }

    _updatePosFromMPos() {
        this.vmState.pos = this._convertCoordSys(this.vmState.mpos, null, this.vmState.activeCoordSys, null, this.vmState.offsetEnabled && this.vmState.offset);
    }

    _updateBounds(bounds, pos, axisFlags) {
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

    getAxisValue(axis) {
        return axis ? Number(axis.slice(1)) : '';
    }

    zerocoord(val = 0) {
        let coords = [];
        for (let i = 0; i < this.vmState.axisLabels.length; i++) {
            coords.push(val);
        }
        return coords;
    }

    _processMove(to, axisFlags, feed = null, travel = null, incremental = false) {
        if (incremental) {
            // Update pos if incremental coordinates
            for (let axisNum = 0; axisNum < this.vmState.pos.length; axisNum++) {
                to = objtools.deepCopy(to);
            }
        }
        // Calculate distance travelled if not provided
        if (travel === null) {
            let travelSq = 0;
            for (let axisNum = 0; axisNum < this.vmState.pos.length; axisNum++) {
                if (to[axisNum] === null || to[axisNum] === undefined) {
                    to[axisNum] = this.vmState.pos[axisNum];
                }
                travelSq += Math.pow((to[axisNum] || 0) - (this.vmState.pos[axisNum] || 0), 2);
            }
            travel = Math.sqrt(travelSq);
        }
        let from = this.vmState.pos;
        let moveTime;
        if (this.vmState.inverseFeed && feed) {
            // Handle time calc if inverse feed
            // Calculate the minimum amount of time this move would take so we can compare it to the requested time
            let minTime = 0;
            for (let axisNum = 0; axisNum < to.length && axisNum < from.length; axisNum++) {
                let axisTravel = Math.abs(from[axisNum] - to[axisNum]);
                let axisFeed = Array.isArray(this.options.maxFeed) ? this.options.maxFeed[axisNum] : this.options.maxFeed;
                let travelTime = axisTravel / (axisFeed || 1000) * 60;
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
                this._lastMoveAxisFeeds = this.zerocoord();
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
                let accel = Array.isArray(this.options.acceleration) ? this.options.acceleration[axisNum] : this.options.acceleration;
                if (accelMin === null || accel < accelMin) {
                    accelMin = accel;
                }
                let diff = to[axisNum] - this.vmState.pos[axisNum];
                // calculate feed component for this axis (may be negative to indicate negative direction)
                let axisFeed;
                if (!feed) { // G0
                    axisFeed = Array.isArray(this.options.maxFeed) ? this.options.maxFeed[axisNum] : this.options.maxFeed;
                } else {
                    axisFeed = diff / linearDist * feed; // in units/min
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
            let accelDist = Math.abs((1 / 2) * accelMin * (maxAccelTime * maxAccelTime));
            if (accelDist > travel) {
                accelDist = travel;
            }
            // Calcualate the base move time (time when travelling over move at max feed, minus the distances for acceleration)
            if (!feed) { // G0
                moveTime = 0;
                for (let axisNum = 0; axisNum < to.length && axisNum < from.length; axisNum++) {
                    let accel = Array.isArray(this.options.acceleration) ? this.options.acceleration[axisNum] : this.options.acceleration;
                    let axisAccelTime = axisAccelTimes[axisNum];
                    let axisAccelDist = Math.abs((1 / 2) * accel * (axisAccelTime * axisAccelTime));
                    let axisTravel = Math.abs(to[axisNum] - this.vmState.pos[axisNum]);
                    if (axisAccelDist > axisTravel) {
                        axisAccelDist = axisTravel;
                    }
                    axisTravel -= axisAccelDist;
                    let axisFeed = Array.isArray(this.options.maxFeed) ? this.options.maxFeed[axisNum] : this.options.maxFeed;
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
            this.vmState.pos[axisNum] = to[axisNum];
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
