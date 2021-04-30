/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint prefer-arrow-callback: 0 */
const promisify = (fn, options) => function (...args) {
    const {
        errorFirst = true,
        thisArg
    } = { ...options };

    return new Promise((resolve, reject) => {
        args.push(function (...results) {
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
                resolve();
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
