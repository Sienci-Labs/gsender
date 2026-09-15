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

export const preventDefault = (e: Event): void => {
    if (typeof e.preventDefault !== 'undefined') {
        e.preventDefault();
    } else {
        e.returnValue = false;
    }
};

export const stopPropagation = (e: Event): void => {
    if (typeof e.stopPropagation !== 'undefined') {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }
};

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Compatibility
export const addEventListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
): void => {
    if (target.addEventListener) {
        // Standard
        target.addEventListener(type, listener, false);
    }
    // } else if (target.attachEvent) { // IE8
    //     // In Internet Explorer versions before IE 9, you have to use attachEvent rather than the standard addEventListener.
    //     target.attachEvent('on' + type, listener);
    // }
};

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
export const removeEventListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
): void => {
    if (target.removeEventListener) {
        // Standard
        target.removeEventListener(type, listener, false);
    }
    // } else if (target.detachEvent) { // IE8
    //     // In Internet Explorer versions before IE 9, you have to use detachEvent rather than the standard removeEventListener.
    //     target.detachEvent('on' + type, listener);
    // }
};
