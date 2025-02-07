// Forked from https://github.com/cncjs/gcode-parser
// Specifically the parseLine function
// import { parseLine } from 'gcode-parser';

interface ParseLineOptions {
    // flatten?: boolean;
    noParseLine?: boolean;
}

interface ParseLineResult {
    line: string;
    words: [string, any][];
    ln?: number;
    cs?: number;
    cmds?: string[];
    err?: boolean;
}

export const parseLine = (
    line: string,
    options: ParseLineOptions = {},
): ParseLineResult => {
    // http://reprap.org/wiki/G-code#Special_fields
    // The checksum "cs" for a GCode string "cmd" (including its line number) is computed
    // by exor-ing the bytes in the string up to and not including the * character.
    const computeChecksum = (s: string): number => {
        s = s || '';
        if (s.lastIndexOf('*') >= 0) {
            s = s.substr(0, s.lastIndexOf('*'));
        }

        let cs = 0;
        for (let i = 0; i < s.length; ++i) {
            const c = s[i].charCodeAt(0);
            cs ^= c;
        }
        return cs;
    };

    // http://linuxcnc.org/docs/html/gcode/overview.html#gcode:comments
    // Comments can be embedded in a line using parentheses () or for the remainder of a line using a semi-colon. The semi-colon is not treated as the start of a comment when enclosed in parentheses.
    const stripComments = (line: string): string => {
        const re1 = /\s*\([^\)]*\)/g; // Remove anything inside the parentheses
        const re2 = /\s*;.*/g; // Remove anything after a semi-colon to the end of the line, including preceding spaces
        const re3 = /\s+/g;
        return line.replace(re1, '').replace(re2, '').replace(re3, '');
    };

    const re =
        /(%.*)|({.*)|((?:\$\$)|(?:\$[a-zA-Z0-9#]*))|([a-zA-Z][0-9\+\-\.]+)|(\*[0-9]+)/gim;

    // options.flatten = !!options.flatten;
    options.noParseLine = !!options.noParseLine;

    const result: ParseLineResult = {
        line: line,
        words: [],
    };

    if (options.noParseLine) {
        return result;
    }

    let ln: number | undefined; // Line number
    let cs: number | undefined; // Checksum
    const words = stripComments(line).match(re) || [];

    for (let i = 0; i < words.length; ++i) {
        const word = words[i];
        const letter = word[0].toUpperCase();
        const argument = word.slice(1);

        // Parse % commands for bCNC and CNCjs
        // - %wait Wait until the planner queue is empty
        if (letter === '%') {
            result.cmds = (result.cmds || []).concat(line.trim());
            continue;
        }

        // Parse JSON commands for TinyG and g2core
        if (letter === '{') {
            result.cmds = (result.cmds || []).concat(line.trim());
            continue;
        }

        // Parse $ commands for Grbl
        // - $C Check gcode mode
        // - $H Run homing cycle
        if (letter === '$') {
            result.cmds = (result.cmds || []).concat(`${letter}${argument}`);
            continue;
        }

        // N: Line number
        if (letter === 'N' && typeof ln === 'undefined') {
            // Line (block) number in program
            ln = Number(argument);
            continue;
        }

        // *: Checksum
        if (letter === '*' && typeof cs === 'undefined') {
            cs = Number(argument);
            continue;
        }

        let value: string | number = Number(argument);
        if (Number.isNaN(value)) {
            value = argument;
        }

        // if (options.flatten) {
        //     result.words.push(letter + value);
        // } else {
        result.words.push([letter, String(value)]);
        // }
    }

    // Line number
    if (typeof ln !== 'undefined') {
        result.ln = ln;
    }

    // Checksum
    if (typeof cs !== 'undefined') {
        result.cs = cs;
        if (computeChecksum(line) !== cs) {
            result.err = true; // checksum failed
        }
    }

    return result;
};

export const parseStringSync = (str: string, options: ParseLineOptions) => {
    const results = [];
    const lines = str.split('\n');

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i].trim();
        if (line.length === 0) {
            continue;
        }
        const result = parseLine(line, options);
        results.push(result);
    }

    return results;
};
