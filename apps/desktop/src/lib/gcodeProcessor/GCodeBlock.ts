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

import { BasicObject, BasicType } from 'definitions/general';

class GCodeBlock {
    words: Array<Array<string>> = null;
    pairs: BasicObject = null;
    flatPairs: BasicObject = null;
    line: string = '';

    constructor(words: Array<Array<string>>, line: string) {
        this.line = line;
        this.words = words;
        this.toPairs();
    }

    toPairs(): void {
        const result: BasicObject = {};
        const flatResult: BasicObject = {};
        for (let word of this.words) {
            let letter = word[0];
            let value = word[1];
            flatResult[letter] = value;
            if (letter === 'G' || letter === 'L') {
                result[`${letter}${value}`] = true;
            } else {
                result[letter] = value;
            }
        }
        this.pairs = result;
        this.flatPairs = flatResult;
    }

    asString(): string {
        return this.line;
    }

    has(word: string): boolean {
        const result = word in this.pairs;
        return result;
    }

    hasLetter(letter: string): boolean {
        return letter in this.flatPairs;
    }

    get(word: string): BasicType {
        if (word in this.pairs) {
            return this.pairs[word];
        }
        return null;
    }

    getLetter(letter: string): BasicType {
        if (letter in this.flatPairs) {
            return this.flatPairs[letter];
        }
        return null;
    }

    getAxes(): Array<string> {
        const axes: Array<string> = [];
        if (this.has('X')) {
            axes.push('X');
        }
        if (this.has('Y')) {
            axes.push('Y');
        }
        if (this.has('Z')) {
            axes.push('Z');
        }
        return axes;
    }

    isSimpleMotion(): boolean {
        return this.has('G0') || this.has('G1');
    }
}

export default GCodeBlock;
