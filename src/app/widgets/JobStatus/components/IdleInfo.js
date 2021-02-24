import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import styles from './IdleInfo.styl';
import FileStat from './FileStat';

/**
 * Idle Information component displaying job information when status is set to idle
 * @param {Object} state Default state given from parent component
 */
const IdleInfo = ({ state }) => {
    const {
        bbox: { delta },
        units,
        total,
        remainingTime,
        fileName,
        connected,
        fileSize,
        toolsAmount,
        toolsUsed,
        feedrateMin,
        feedrateMax,
        spindleSpeedMin,
        spindleSpeedMax
    } = state;

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
                <FileStat label="Dimensions">{`${delta.x} ${units} (X)`}<br />{`${delta.y} ${units} (Y)`}<br />{`${delta.z} ${units} (Z)`}</FileStat>
                <FileStat label="Feed Range">{feedrateMin} to {feedrateMax} mm/min</FileStat>
                <FileStat label="Spindle Range">{spindleSpeedMin} to {spindleSpeedMax} RPM</FileStat>
                <FileStat label="Tools Used">{toolsAmount > 0 ? `${toolsAmount} (${formattedToolsUsed()})` : 'None'}</FileStat>
                <FileStat label="Runtime">{outputFormattedTime(remainingTime)}</FileStat>
            </div>
        </div>
    ) : (
        <div className={styles['disconnected-info']}>
            <div>{connected ? 'No File Loaded...' : 'Not Connected to a Machine...'}</div>
        </div>
    );
};

IdleInfo.propTypes = {
    state: PropTypes.object,
};

export default IdleInfo;
