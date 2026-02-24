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

export interface FastLineScanScratch {
    letters: string[];
    values: string[];
    count: number;
    hasInvalidTokens: boolean;
}

const COMMENT_PARENS_RE = /\s*\([^\)]*\)/g;
const COMMENT_SEMICOLON_RE = /\s*;.*/g;
const WHITESPACE_RE = /\s+/g;
const WORD_MATCH_RE =
    /(%.*)|({.*)|((?:\$\$)|(?:\$[a-zA-Z0-9#]*))|([a-zA-Z][0-9\+\-\.]+)|(\*[0-9]+)/gim;

const ALLOWED_WORD_LETTERS = new Set<string>([
    'N',
    'G',
    'M',
    'X',
    'Y',
    'Z',
    'H',
    'I',
    'L',
    'T',
    'P',
    'A',
    'J',
    'K',
    'F',
    'R',
    'S',
]);

const isWhitespaceCode = (code: number): boolean =>
    code === 32 || code === 9 || code === 10 || code === 13;

const isAlphaCode = (code: number): boolean =>
    (code >= 65 && code <= 90) || (code >= 97 && code <= 122);

const isDigitCode = (code: number): boolean => code >= 48 && code <= 57;

const isAlphaNumericHashCode = (code: number): boolean =>
    isAlphaCode(code) || isDigitCode(code) || code === 35;

const isSignedNumberCode = (code: number): boolean =>
    isDigitCode(code) || code === 43 || code === 45 || code === 46;

export const createFastLineScanScratch = (): FastLineScanScratch => ({
    letters: [],
    values: [],
    count: 0,
    hasInvalidTokens: false,
});

export const stripCommentsAndWhitespace = (line: string): string =>
    line
        .replace(COMMENT_PARENS_RE, '')
        .replace(COMMENT_SEMICOLON_RE, '')
        .replace(WHITESPACE_RE, '');

export const scanLineFast = (
    line: string,
    scratch: FastLineScanScratch,
): FastLineScanScratch => {
    scratch.letters.length = 0;
    scratch.values.length = 0;
    scratch.count = 0;
    scratch.hasInvalidTokens = false;

    const length = line.length;
    let i = 0;

    while (i < length) {
        const code = line.charCodeAt(i);

        if (isWhitespaceCode(code)) {
            i++;
            continue;
        }

        // ; comment until end-of-line
        if (code === 59) {
            break;
        }

        // ( ... ) inline comment
        if (code === 40) {
            i++;
            while (i < length && line.charCodeAt(i) !== 41) {
                i++;
            }
            if (i < length && line.charCodeAt(i) === 41) {
                i++;
            }
            continue;
        }

        const ch = line[i];

        // % command (bCNC/CNCjs) - consume remainder
        if (ch === '%') {
            scratch.letters.push('%');
            scratch.values.push(line.slice(i + 1).trim());
            scratch.count += 1;
            break;
        }

        // JSON command (TinyG/g2core) - consume remainder
        if (ch === '{') {
            scratch.letters.push('{');
            scratch.values.push(line.slice(i + 1).trim());
            scratch.count += 1;
            break;
        }

        // $ command (Grbl)
        if (ch === '$') {
            let j = i + 1;
            if (j < length && line[j] === '$') {
                scratch.letters.push('$');
                scratch.values.push('$');
                scratch.count += 1;
                i = j + 1;
                continue;
            }

            while (j < length && isAlphaNumericHashCode(line.charCodeAt(j))) {
                j++;
            }

            const value = line.slice(i + 1, j);
            if (value.length === 0) {
                scratch.hasInvalidTokens = true;
                i++;
                continue;
            }

            scratch.letters.push('$');
            scratch.values.push(value);
            scratch.count += 1;
            i = j;
            continue;
        }

        // checksum
        if (ch === '*') {
            let j = i + 1;
            while (j < length && isDigitCode(line.charCodeAt(j))) {
                j++;
            }
            if (j === i + 1) {
                scratch.hasInvalidTokens = true;
                i++;
                continue;
            }

            scratch.letters.push('*');
            scratch.values.push(line.slice(i + 1, j));
            scratch.count += 1;
            i = j;
            continue;
        }

        if (isAlphaCode(code)) {
            const letter = ch.toUpperCase();
            let j = i + 1;
            while (j < length && isSignedNumberCode(line.charCodeAt(j))) {
                j++;
            }

            if (j === i + 1) {
                scratch.hasInvalidTokens = true;
                i++;
                continue;
            }

            // N: Line number — consume token but don't record it (matches parseLine behaviour)
            if (letter === 'N') {
                i = j;
                continue;
            }

            if (!ALLOWED_WORD_LETTERS.has(letter)) {
                scratch.hasInvalidTokens = true;
            }

            scratch.letters.push(letter);
            scratch.values.push(line.slice(i + 1, j));
            scratch.count += 1;
            i = j;
            continue;
        }

        scratch.hasInvalidTokens = true;
        i++;
    }

    return scratch;
};

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

export const parseLine = (
    line: string,
    options: ParseLineOptions = {},
): ParseLineResult => {
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
    WORD_MATCH_RE.lastIndex = 0;
    const words = stripCommentsAndWhitespace(line).match(WORD_MATCH_RE) || [];

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
