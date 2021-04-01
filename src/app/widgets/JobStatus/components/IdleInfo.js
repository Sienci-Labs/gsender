import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { in2mm, mm2in } from '../../../lib/units';

import styles from './IdleInfo.styl';
import FileStat from './FileStat';
import { IMPERIAL_UNITS, METRIC_UNITS } from '../../../constants';

/**
 * Idle Information component displaying job information when status is set to idle
 * @param {Object} state Default state given from parent component
 */
const IdleInfo = ({ state }) => {
    const {
        bbox: { delta, min, max },
        units,
        total,
        remainingTime,
        fileName,
        fileSize,
        toolsAmount,
        toolsUsed,
        feedrateMin,
        feedrateMax,
        spindleSpeedMin,
        spindleSpeedMax,
        fileModal
    } = state;

    let convertedFeedMin, convertedFeedMax, feedUnits;
    feedUnits = (units === METRIC_UNITS) ? 'mm/min' : 'ipm';
    if (units === METRIC_UNITS) {
        convertedFeedMin = (fileModal === METRIC_UNITS) ? feedrateMin : in2mm(feedrateMin).toFixed(2);
        convertedFeedMax = (fileModal === METRIC_UNITS) ? feedrateMax : in2mm(feedrateMax).toFixed(2);
    } else {
        convertedFeedMin = (fileModal === IMPERIAL_UNITS) ? feedrateMin : mm2in(feedrateMin).toFixed(3);
        convertedFeedMax = (fileModal === IMPERIAL_UNITS) ? feedrateMax : mm2in(feedrateMax).toFixed(3);
    }
    /**
     * Return formatted list of tools in use
     */
    const formattedToolsUsed = () => {
        let line = '';

        for (const item of toolsUsed) {
            line += `${item}, `;
        }

        return line.slice(0, -2); //Remove space and apostrophe at the end
    };

    /**
     * Format given time value to display minutes and seconds
     * @param {Number} givenTime given time value
     */
    const outputFormattedTime = (givenTime) => {
        if (state.startTime === 0 || !givenTime || givenTime < 0) {
            return 'N/A';
        }

        //Given time is a unix timestamp to be compared to unix timestamp 0
        const elapsedMinute = moment(moment(givenTime)).diff(moment.unix(0), 'minutes');
        const elapsedSecond = String((moment(moment(givenTime)).diff(moment.unix(0), 'seconds')));

        //Grab last two characters in the elapsedSecond variable, which represent the seconds that have passed
        const strElapsedSecond = `${(elapsedSecond[elapsedSecond.length - 2] !== undefined ? elapsedSecond[elapsedSecond.length - 2] : '')}${String(elapsedSecond[elapsedSecond.length - 1])}`;
        const formattedSeconds = Number(strElapsedSecond) < 59 ? Number(strElapsedSecond) : `${Number(strElapsedSecond) - 60}`;

        return `${elapsedMinute}m ${Math.abs(formattedSeconds)}s`;
    };

    /**
     * Determine the file size format between bytes, kilobytes (KB) and megabytes (MB)
     */
    const fileSizeFormat = () => {
        const ONE_KB = 1000;
        const ONE_MB = 1000000;

        if (fileSize >= ONE_KB && fileSize < ONE_MB) {
            return `${(fileSize / ONE_KB).toFixed(0)} KB`;
        } else if (fileSize >= ONE_MB) {
            return `${(fileSize / ONE_MB).toFixed(1)} MB`;
        }

        return `${fileSize} bytes`;
    };

    return fileName ? (
        <div className={styles['idle-info']}>
            <div><span className={styles['file-name']}>{fileName}</span> ({fileSizeFormat()}, {total} lines)</div>
            <div className={styles.idleInfoRow}>
                <FileStat label="Attributes">
                    {`${outputFormattedTime(remainingTime)}`}<br /> {`${convertedFeedMin}`} to {`${convertedFeedMax} ${feedUnits}`}
                </FileStat>
                <FileStat label="Spindle">
                    {spindleSpeedMin} to {spindleSpeedMax} RPM
                    <br />
                    {toolsAmount > 0 ? `${toolsAmount} (${formattedToolsUsed()})` : 'No Tools'}
                </FileStat>
                <FileStat label="Dimensions">
                    {`${delta.x} ${units} (X)`}
                    <br />
                    {`${delta.y} ${units} (Y)`}
                    <br />
                    {`${delta.z} ${units} (Z)`}
                </FileStat>
                <FileStat label="Minimum">
                    {`${min.x} ${units} (X)`}
                    <br />
                    {`${min.y} ${units} (Y)`}
                    <br />
                    {`${min.z} ${units} (Z)`}
                </FileStat>
                <FileStat label="Maximum">
                    {`${max.x} ${units} (X)`}
                    <br />
                    {`${max.y} ${units} (Y)`}
                    <br />
                    {`${max.z} ${units} (Z)`}
                </FileStat>
            </div>
        </div>
    ) : (
        <div className={styles['idle-info']}>
            <div><span className={styles['file-name']}>No File Loaded</span></div>
            <div className={styles.idleInfoRow}>
                <FileStat label="Attributes">-</FileStat>
                <FileStat label="Spindle">-</FileStat>
                <FileStat label="Dimensions">-</FileStat>
                <FileStat label="Minimum">-</FileStat>
                <FileStat label="Maximum">-</FileStat>
            </div>
        </div>
    );
};

IdleInfo.propTypes = {
    state: PropTypes.object,
};

export default IdleInfo;
