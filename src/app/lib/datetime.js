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

// solution found here: https://stackoverflow.com/a/59948911
export const convertMillisecondsToTimeStamp = (milliseconds) => {
    if (milliseconds) {
        let seconds = milliseconds / 1000;
        const hours = parseInt(seconds / 3600, 10);
        seconds %= 3600; // seconds remaining after extracting hours
        const minutes = parseInt(seconds / 60, 10);
        seconds %= 60; // keep only seconds not extracted to minutes
        seconds = parseInt(seconds, 10);
        return `${String(hours).padStart(2, 0)}:${String(minutes).padStart(2, 0)}:${String(seconds).padStart(2, 0)}`;
    }
    return null;
};

export const convertSecondsToTimeStamp = (seconds) => {
    return convertMillisecondsToTimeStamp(seconds * 1000);
};

export const convertISOStringToDateAndTime = (ISOString) => {
    const dateTime = new Date(ISOString);
    const date = `${String(dateTime.getFullYear())}-${String(dateTime.getMonth()).padStart(2, 0)}-${String(dateTime.getDate()).padStart(2, 0)}`;
    const time = `${String(dateTime.getHours()).padStart(2, 0)}:${String(dateTime.getMinutes()).padStart(2, 0)}:${String(dateTime.getSeconds()).padStart(2, 0)}`;
    return [date, time];
};
