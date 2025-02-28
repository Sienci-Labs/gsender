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

import moment from 'moment';

// solution found here: https://stackoverflow.com/a/59948911
export const convertMillisecondsToTimeStamp = (
    milliseconds: number,
    short = false,
): string => {
    if (milliseconds >= 0) {
        let seconds = milliseconds / 1000;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600; // seconds remaining after extracting hours
        const minutes = Math.floor(seconds / 60);
        seconds %= 60; // keep only seconds not extracted to minutes
        seconds = Math.floor(seconds);

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const newHours = Math.floor(hours % 24); // get remaining hours
            return `${String(days).padStart(2, '0')}d ${String(newHours).padStart(2, '0')}h`;
        }

        if (short) {
            if (hours !== 0) {
                return `${String(hours).padStart(2, '0')}hr ${String(minutes).padStart(2, '0')}m`;
            } else {
                return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
            }
        }

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return '-';
};

export const convertSecondsToDHMS = (
    seconds: number,
): [number, number, number, number] => {
    if (seconds >= 0) {
        let hours = Math.floor(seconds / 3600);
        seconds %= 3600; // seconds remaining after extracting hours
        const minutes = Math.floor(seconds / 60);
        seconds %= 60; // keep only seconds not extracted to minutes
        seconds = Math.floor(seconds);

        let days = 0;
        if (hours >= 24) {
            days = Math.floor(hours / 24);
            hours = Math.floor(hours % 24); // get remaining hours
        }

        return [days, hours, minutes, seconds];
    }

    return [0, 0, 0, 0];
};

export const convertSecondsToTimeStamp = (
    seconds: number,
    startTime: number,
): string => {
    if (startTime === 0 || seconds === undefined) {
        return '-';
    } else if (seconds <= 0) {
        return 'Finishing Soon';
    }

    return convertMillisecondsToTimeStamp(seconds * 1000);
};

export const convertISOStringToDateAndTime = (
    ISOString: string,
): Array<string> => {
    const dateFromString = moment(ISOString);

    if (!dateFromString.isValid()) {
        return ['-', '-'];
    }

    const date = dateFromString.format('YYYY-MM-DD');
    const time = dateFromString.format('HH:mm:ss');

    return [date, time];
};
