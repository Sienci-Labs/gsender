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

import pubsub from 'pubsub-js';

// Styling choices
export const TOASTER_INFO = 'info';
export const TOASTER_WARNING = 'warning';
export const TOASTER_DANGER = 'danger';
export const TOASTER_SUCCESS = 'success';

// Durations
export const TOASTER_SHORT = 2000;
export const TOASTER_DEFAULT = 5000;
export const TOASTER_LONG = 10000;
export const TOASTER_UNTIL_CLOSE = -1;
export const TOASTER_DISABLED = -2;

export const Toaster = {
    pop: (options) => {
        pubsub.publish('toast:new', options);
    },
    clear: () => {
        pubsub.publish('toast:clear');
    },
};
