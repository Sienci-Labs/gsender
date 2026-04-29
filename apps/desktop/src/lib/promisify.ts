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

/* eslint prefer-arrow-callback: 0 */
const promisify = (
    fn: Function,
    options: { errorFirst: boolean; thisArg: any },
) =>
    function (...args: Array<any>): Promise<any> {
        const { errorFirst = true, thisArg } = { ...options };

        return new Promise((resolve, reject) => {
            args.push(function (...results: Array<any>) {
                if (errorFirst) {
                    const err = results.shift();
                    if (err) {
                        reject(err);
                        return;
                    }
                }

                if (results.length > 1) {
                    resolve(results);
                } else if (results.length === 1) {
                    resolve(results[0]);
                } else {
                    resolve([]);
                }
            });

            if (typeof fn !== 'function') {
                reject(new TypeError('The first parameter must be a function'));
                return;
            }

            fn.apply(thisArg, args);
        });
    };

export default promisify;
