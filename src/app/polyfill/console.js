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

// Avoid `console` errors in browsers that lack a console.
(function(global) {
    window.console = window.console || {};

    const noop = function noop() {};
    const console = window.console;
    const methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    let length = methods.length;

    while (length--) {
        const method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }

        // http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
        if (Function.prototype.bind && window.console && typeof console.log === 'object') {
            const that = Function.prototype.call;
            console[method] = that.bind(console[method], console);
        }
    }
}(this));
