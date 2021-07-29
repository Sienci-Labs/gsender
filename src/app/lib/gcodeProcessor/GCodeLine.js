const objtools = require('objtools');

const modalGroupsG = [
    [],
    ['G0', 'G1', 'G2', 'G3', 'G33', 'G38', 'G73', 'G76', 'G80', 'G81', 'G82', 'G84', 'G85', 'G86', 'G87', 'G88', 'G89'],
    ['G17', 'G18', 'G19', 'G17.1', 'G17.2', 'G17.3'],
    ['G90', 'G91'],
    ['G90.1', 'G91.1'],
    ['G93', 'G94'],
    ['G20', 'G21'],
    ['G40', 'G41', 'G42', 'G41.1', 'G42.1'],
    ['G43', 'G43.1', 'G49'],
    ['G98', 'G99'],
    ['G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'G59.1', 'G59.2', 'G59.3'],
    ['G61', 'G61.1', 'G64'],
    ['G96', 'G97'],
    ['G7', 'G8']
];
let modalGroupsGByCode = {};
for (let gidx = 0; gidx < modalGroupsG.length; gidx++) {
    for (let code of modalGroupsG[gidx]) {
        modalGroupsGByCode[code] = gidx;
    }
}
const modalGroupsM = [
    [],
    [],
    [],
    [],
    ['M0', 'M1', 'M2', 'M30', 'M60'],
    [],
    [],
    ['M3', 'M4', 'M5'],
    ['M7', 'M8', 'M9'],
    ['M48', 'M49']
];
let modalGroupsMByCode = {};
for (let gidx = 0; gidx < modalGroupsM.length; gidx++) {
    for (let code of modalGroupsM[gidx]) {
        modalGroupsMByCode[code] = gidx;
    }
}
const nonModals = ['G4', 'G10', 'G28', 'G30', 'G53', 'G92', 'G92.1', 'G92.2', 'G92.3'];

const coordOrder = ['P', 'X', 'Y', 'Z', 'A', 'B', 'C', 'F'];

/**
 * This class is a parser, modification interface, and generator for gcode.
 *
 * https://github.com/CrispyConductor/tightcnc/blob/332a3a67309d5fe258e2d1567f94ac1e172bac47/lib/gcode-line.js
 *
 * @class GcodeLine
 */
class GcodeLine {
    /**
     * The constructor can be called in one of the following forms:
     * - GcodeLine() - Creates an empty line to be filled in.
     * - GcodeLine(string) - Parses the line string.
     * - GcodeLine([ [ letter, value ] ]) - Uses the array of words given
     * - GcodeLine([ word ]) - Concatenates the array of strings then parses
     * - GcodeLine(gline) - Copy constructor
     */
    constructor(arg) {
        this.modified = false;
        this.isGcodeLine = true;
        if (arg === null || arg === undefined || (Array.isArray(arg) && arg.length === 0)) {
            this.words = [];
            this.comment = '';
            this.commentStyle = '(';
            this.origLine = null;
        } else if (typeof arg === 'string') {
            this.origLine = arg;
            this.parse(arg);
        } else if (Array.isArray(arg) && typeof arg[0] === 'string') {
            this.origLine = arg.join(' ');
            this.parse(this.origLine);
        } else if (Array.isArray(arg) && Array.isArray(arg[0])) {
            this.words = arg;
            this.comment = '';
            this.commentStyle = '(';
            this.origLine = this.toString();
        } else if (arg && arg instanceof GcodeLine) {
            this.words = objtools.deepCopy(arg.words);
            this.comment = arg.comment;
            this.commentStyle = arg.commentStyle;
            this.origLine = arg.origLine;
            this.modified = arg.modified;
        } else {
            // throw new Error('Invalid call to GcodeLine constructor');
            console.error('Invalid call to GcodeLine constructor');
        }
    }

    /**
     * Fetches the value associated with the given gcode letter.
     *
     * By default, returns the numeric value, or null if it doesn't exist.  If multiple words match, throws an exception.
     * If multi mode is turned on, this always returns an array of all matches (or empty array).
     *
     * @method get
     * @param {String} letter - The better to fetch the value for.
     * @param {Number|String|null} [mgroup=null] - Only fetch values for G or M codes in this modal group.  Model group is
     *   identified either by group number or by any G or M code within the group.
     * @param {Boolean} [multi=false] - If true, returns an array of all matching words.
     * @return {Number|Number[]|null}
     */
    get(letter, mgroup = null, multi = false) {
        // Convert letter to uppercase
        letter = letter.toUpperCase();

        // If mgroup is a full code, convert it to a group number
        if (mgroup && typeof mgroup === 'string') {
            let omgroup = mgroup;
            if (letter === 'G') {
                mgroup = modalGroupsGByCode[mgroup];
            } else if (letter === 'M') {
                mgroup = modalGroupsMByCode[mgroup];
            } else {
                // throw new Error('Can only use modal group parameter with G or M codes');
                console.error('Can only use modal group parameter with G or M codes');
                return null;
            }
            if (!mgroup) {
                // throw new Error('Could not find modal group for code ' + omgroup);
                console.error('Could not find modal group for code ' + omgroup);
                return null;
            }
        }
        let mgroupMap;
        if (mgroup) {
            mgroupMap = {};
            if (letter === 'G') {
                mgroupMap = modalGroupsGByCode;
            } else if (letter === 'M') {
                mgroupMap = modalGroupsMByCode;
            } else {
                mgroup = null;
            }
        }

        let matches = multi ? [] : null;
        for (let word of this.words) {
            if (word[0] === letter) {
                if (mgroup) {
                    let fullCode = letter + word[1];
                    if (mgroup !== mgroupMap[fullCode]) {
                        continue;
                    }
                }
                if (multi) {
                    matches.push(word[1]);
                } else {
                    if (matches !== null) {
                        // throw new Error('Multiple words with the same letter on gcode line: ' + this.toString());
                        console.error('Multiple words with the same letter on gcode line: ' + this.toString());
                        return null;
                    }
                    matches = word[1];
                }
            }
        }

        return matches;
    }

    /**
     * Sets a word value.
     *
     * This is normally called with the letter and value.  Optionally, the full code (ie, G0) can be supplied as
     * the first argument if the value is undefined.
     *
     * value can be null.  This deletes the word.
     *
     * If the word doesn't exist, it is added.  By default, the word is added at a guessed position.
     * This can be overridden by specifying a position as the third argument.
     *
     * This throws if there are multiple words matching the same letter.
     *
     * @method set
     * @param {String} letter - The letter of the word.
     * @param {Number|null} value - Value to set.
     * @param {Number} [pos=null] - Position in the word array to add the word, if it doesn't exist.
     */
    set(letter, value, pos = null) {
        if (letter.length > 1 && (value === null || value === undefined)) {
            // Handle case of supplying a single string
            return this.set(letter[0], parseFloat(letter.slice(1)), pos);
        }

        letter = letter.toUpperCase();
        let wordIdx = null;
        for (let i = 0; i < this.words.length; i++) {
            if (this.words[i][0] === letter) {
                if (wordIdx !== null) {
                    // throw new Error('Multiple words with the same letter on gcode line');
                    console.error('Multiple words with the same letter on gcode line');
                    return null;
                }
                wordIdx = i;
            }
        }

        if (wordIdx !== null) {
            if (value === null || value === undefined) {
                this.words.splice(wordIdx, 1);
                this.modified = true;
            } else if (this.words[wordIdx][1] !== value) {
                this.words[wordIdx][1] = value;
                this.modified = true;
            }
            return null;
        }

        if (value === null || value === undefined) {
            return null;
        }

        if (pos === null || pos === undefined) {
            // Guess position of word
            let posMap = {};
            for (let i = 0; i < this.words.length; i++) {
                posMap[this.words[i][0]] = i;
            }
            if (letter === 'N') {
                pos = 0; // line numbers go at the beginning
            } else if (letter === 'G' || letter === 'M') {
                // G or M go at the beginning, unless there's a line number
                if (posMap.N === 0) {
                    pos = 1;
                } else {
                    pos = 0;
                }
            } else if (coordOrder.indexOf(letter) !== -1) {
                let coordIdx = coordOrder.indexOf(letter);
                for (let i = coordIdx - 1; i >= 0; i--) {
                    if (posMap[coordOrder[i]] !== undefined) {
                        pos = posMap[coordOrder[i]] + 1;
                        break;
                    }
                }
                if (pos === null || pos === undefined) {
                    for (let i = coordIdx + 1; i < coordOrder.length; i++) {
                        if (posMap[coordOrder[i]] !== undefined) {
                            pos = posMap[coordOrder[i]];
                            break;
                        }
                    }
                }
                if (pos === null || pos === undefined) {
                    pos = this.words.length;
                }
            } else {
                // Default to putting it at the end
                pos = this.words.length;
            }
        }

        // Insert new word
        this.words.splice(pos, 0, [letter, value]);
        this.modified = true;

        return null;
    }

    remove(letter) {
        this.set(letter, null);
    }

    /**
     * Checks if this contains a word with the given letter, optionally within the given modal group.
     * A full word may also be given (eg. G1) which checks if that word is present with that value.
     * In this case, no leading zeros may be present in the word value.
     *
     * @method has
     * @param {String} letter - The single letter to check for, or whole word.
     * @param {Number|String|null} mgroup - If a single letter is provided, the modal group to check for.
     * @return {Boolean}
     */
    has(letter, mgroup = null) {
        letter = letter.toUpperCase();
        if (letter.length > 1) {
            for (let word of this.words) {
                if (letter === word[0] + word[1]) {
                    return true;
                }
            }
            return false;
        } else if (mgroup !== null) {
            let vals = this.get(letter, mgroup, true);
            return vals.length > 0;
        } else {
            for (let word of this.words) {
                if (letter === word[0]) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Appends a comment to the gcode line.
     *
     * @method addComment
     * @param {String} str
     */
    addComment(str) {
        if (this.comment) {
            this.comment += '; ';
        }
        this.comment += str;
        this.modified = true;
    }

    /**
     * Returns a coordinate array with any coordinates specified in the line.  Array indexes for coordinates not specified are set
     * to null.  The axis labels corresponding to each index can be specified, and default to [ 'x', 'y', 'z', 'a', 'b', 'c' ].
     *
     * @method getCoords
     * @return {Number[]}
     */
    getCoords(axisLabels = null) {
        if (!axisLabels) {
            axisLabels = ['x', 'y', 'z', 'a', 'b', 'c'];
        }
        let ret = [];
        for (let axisNum = 0; axisNum < axisLabels.length; axisNum++) {
            ret.push(this.get(axisLabels[axisNum]));
        }
        return ret;
    }

    parse(line) {
        let matches;

        // Pull out comments
        this.comment = '';
        const parenCommentRegex = /\(([^)]*)\)/;
        matches = parenCommentRegex.exec(line);
        while (matches) {
            if (!this.commentStyle) {
                this.commentStyle = '(';
            }
            if (this.comment) {
                this.comment += '; ';
            }
            this.comment += matches[1];
            line = line.slice(0, matches.index) + line.slice(matches.index + matches[0].length);
            matches = parenCommentRegex.exec(line);
        }
        let semicolonIdx = line.indexOf(';');
        if (semicolonIdx !== -1) {
            this.commentStyle = ';';
            if (this.comment) {
                this.comment += '; ';
            }
            this.comment += line.slice(semicolonIdx + 1).trim();
            line = line.slice(0, semicolonIdx);
        }
        if (!this.commentStyle) {
            this.commentStyle = '(';
        }

        // Parse words
        this.words = [];
        line = line.trim();
        let wordRegex = /([A-Za-z])\s*(-?[0-9]*\.[0-9]*|-?[0-9]+)\s*/y;
        let lastIndex = 0;
        while (lastIndex < line.length) {
            matches = wordRegex.exec(line);
            if (matches) {
                this.words.push([matches[1].toUpperCase(), (matches[2].indexOf('.') === -1) ? parseInt(matches[2], 10) : parseFloat(matches[2])]);
                lastIndex = wordRegex.lastIndex;
            } else {
                // throw new Error('Error parsing gcode line ' + line);
                console.error('Error parsing gcode line ' + line);
            }
        }
    }

    /**
     * Convert the gcode line into a string.
     *
     * @method toString
     * @param {Boolean} compact=false - If true, generate a compact representation without spaces or comments.
     * @param {Number} prevision=4 - Maximum number of decimal digits to output for floating point values.
     * @param {Number} minCommandDigits=2 - Minimum number of digits to use for M and G words (0 padded).
     * @param {Number} minLineDigits=1 - Minimum number of digits to use for line number (N) words.
     * @return {String}
     */
    toString(compact = false, precision = 4, minCommandDigits = 2, minLineDigits = 1) {
        // if not modified, output the original
        if (!this.modified && this.origLine) {
            return this.origLine;
        }
        let line = '';
        for (let word of this.words) {
            if (line && !compact) {
                line += ' ';
            }
            let valueStr = '' + (+word[1].toFixed(precision));
            let letter = word[0];
            if (letter === 'G' || letter === 'M') {
                while (valueStr.length < minCommandDigits) {
                    valueStr = '0' + valueStr;
                }
            }
            if (letter === 'N') {
                while (valueStr.length < minLineDigits) {
                    valueStr = '0' + valueStr;
                }
            }
            line += letter + valueStr;
        }
        if (this.comment && !compact) {
            if (line) {
                line += ' ';
            }
            if (this.commentStyle === '(') {
                line += '(' + this.comment + ')';
            } else {
                line += ';' + this.comment;
            }
        }
        return line;
    }
}

module.exports = GcodeLine;
module.exports.modalGroupsG = modalGroupsG;
module.exports.modalGroupsGByCode = modalGroupsGByCode;
module.exports.modalGroupsM = modalGroupsM;
module.exports.modalGroupsMByCode = modalGroupsMByCode;
module.exports.nonModals = nonModals;
