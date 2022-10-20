import { EventEmitter } from 'events';
import { parseLine } from 'gcode-parser';

// Available command types
const COMMAND_TYPE = {
    MOVEMENT: 0,
    COMMENT: 1,
    TOOL: 2,
    OTHER: 3
};


class GCodeVirtualizer extends EventEmitter {
    modals = {
        // Motion Mode
        // G0, G1, G2, G3, G80
        motion: 'G0',

        // Coordinate System Select
        // G54, G55, G56, G57, G58, G59
        wcs: 'G54',

        // Plane Select
        // G17: XY-plane, G18: ZX-plane, G19: YZ-plane
        plane: 'G17',

        // Units Mode
        // G20: Inches, G21: Millimeters
        units: 'G21',

        // Distance Mode
        // G90: Absolute, G91: Relative
        distance: 'G90',

        // Arc IJK distance mode
        arc: 'G91.1',

        // Feed Rate Mode
        // G93: Inverse time mode, G94: Units per minute mode, G95: Units per rev mode
        feedrate: 'G94',

        // Cutter Radius Compensation
        cutter: 'G40',

        // Tool Length Offset
        // G43.1, G49
        tlo: 'G49',

        // Program Mode
        // M0, M1, M2, M30
        program: 'M0',

        // Spingle State
        // M3, M4, M5
        spindle: 'M5',

        // Coolant State
        // M7, M8, M9
        coolant: 'M9', // 'M7', 'M8', 'M7,M8', or 'M9'

        // Tool Select
        tool: 0
    }

    position = {
        x: 0,
        y: 0,
        z: 0
    }

    offsets = {
        x: 0,
        y: 0,
        z: 0
    }

    partitionWordsByGroup(words = []) {
        const groups = [];

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const letter = word[0];

            if ((letter === 'G') || (letter === 'M') || (letter === 'T')) {
                groups.push([word]);
                continue;
            }

            if (groups.length > 0) {
                groups[groups.length - 1].push(word);
            } else {
                groups.push([word]);
            }
        }

        return groups;
    }


    /**
     * Returns an object composed from arrays of property names and values.
     * @example
     *   fromPairs([['a', 1], ['b', 2]]);
     *   // => { 'a': 1, 'b': 2 }
     */
    fromPairs(pairs) {
        let index = -1;
        const length = (!pairs) ? 0 : pairs.length;
        const result = {};

        while (++index < length) {
            const pair = pairs[index];
            result[pair[0]] = pair[1];
        }

        return result;
    }


    virtualize(line = '') {
        if (!line) {
            return;
        }
        const parsedLine = parseLine(line);
        const groups = this.partitionWordsByGroup(parsedLine.words);
    }
}


export default GCodeVirtualizer;
