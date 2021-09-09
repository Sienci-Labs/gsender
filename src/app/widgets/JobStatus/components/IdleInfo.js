/* eslint-disable no-alert */
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { in2mm, mm2in } from '../../../lib/units';
import styles from './IdleInfo.styl';
import FileStat from './FileStat';
import { IMPERIAL_UNITS, METRIC_UNITS } from '../../../constants';

/**
 * Idle Information component displaying job information when status is set to idle
 * @param {Object} state Default state given from parent component
 */
const IdleInfo = ({ state, ...props }) => {
    const {
        units,
        lastFileRan,
        fileModal,
        bbox: { delta, min, max } // This is mapped to correct units from redux earlier in the component tree
    } = state;
    const {
        fileLoaded,
        spindleSet,
        toolSet,
        movementSet,
        estimatedTime
    } = props;

    let convertedFeedMin, convertedFeedMax, feedUnits;
    feedUnits = (units === METRIC_UNITS) ? 'mm/min' : 'ipm';

    let feedrateMin = Math.min(...movementSet);
    let feedrateMax = Math.max(...movementSet);
    let spindleMin = Math.min(...spindleSet);
    let spindleMax = Math.max(...spindleSet);


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

        for (const item of toolSet) {
            line += `${item}, `;
        }

        return line.slice(0, -2); //Remove space and apostrophe at the end
    };

    const outputFormattedTimeForLastFile = (givenTime) => {
        //Given time is a unix timestamp to be compared to unix timestamp 0
        const elapsedMinute = moment(moment(givenTime)).diff(moment.unix(0), 'minutes');
        const elapsedSecond = String((moment(moment(givenTime)).diff(moment.unix(0), 'seconds')));

        //Grab last two characters in the elapsedSecond variable, which represent the seconds that have passed
        const strElapsedSecond = `${(elapsedSecond[elapsedSecond.length - 2] !== undefined ? elapsedSecond[elapsedSecond.length - 2] : '')}${String(elapsedSecond[elapsedSecond.length - 1])}`;
        const formattedSeconds = Number(strElapsedSecond) < 59 ? Number(strElapsedSecond) : `${Number(strElapsedSecond) - 60}`;

        return `${elapsedMinute}m ${Math.abs(formattedSeconds)}s`;
    };

    const formatEstimatedTime = (time) => {
        if (time <= 1) {
            return '-';
        }

        if (time > 60 && (time / 60) < 60) {
            return `~ ${Math.ceil((time / 60))} minute(s)`;
        }

        if ((time / 60) >= 60) {
            return `~ ${Math.ceil((time / 3600))} hour(s)`;
        }

        return `~ ${Math.ceil(time)} seconds`;
    };

    const feedString = (movementSet.length > 0) ? `${convertedFeedMin} to ${convertedFeedMax} ${feedUnits}` : 'No Feedrates';

    let elapsedTimeToDisplay = outputFormattedTimeForLastFile(state.lastFileRunLength);

    const formattedEstimateTime = formatEstimatedTime(estimatedTime);

    return fileLoaded ? (
        <div className={styles['idle-info']}>
            <div className={styles.idleInfoRow}>
                <FileStat label="Attributes">
                    {`${formattedEstimateTime}`}
                    <br />
                    {`${feedString}`}
                </FileStat>
                <FileStat label="Spindle">
                    {
                        (spindleSet.length > 0) ? `${spindleMin} to ${spindleMax} RPM` : 'No Spindle'
                    }
                    <br />
                    {toolSet.length > 0 ? `${toolSet.length} (${formattedToolsUsed()})` : 'No Tools'}
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
                <FileStat label="Previous Run">
                    <span className={styles.textWrap}>{`${lastFileRan}`}</span>
                    {`Run Length: ${elapsedTimeToDisplay}`}
                </FileStat>
            </div>
        </div>
    ) : (
        <div className={styles['idle-info']}>
            <div className={styles.idleInfoRow}>
                <FileStat label="Attributes">-</FileStat>
                <FileStat label="Spindle">-</FileStat>
                <FileStat label="Dimensions">-</FileStat>
                <FileStat label="Minimum">-</FileStat>
                <FileStat label="Maximum">-</FileStat>
                {
                    lastFileRan
                        ? (
                            <FileStat label="Previous Run">
                                <span className={styles.textWrap}>{`${lastFileRan}`}</span>
                                {`Run Length: ${elapsedTimeToDisplay}`}
                            </FileStat>
                        ) : <FileStat label="Previous Run">-</FileStat>
                }
            </div>
        </div>
    );
};

IdleInfo.propTypes = {
    state: PropTypes.object,
};

export default connect((store) => {
    const file = get(store, 'file', {});

    const movementSet = [...file.movementSet].map(value => Number(value.slice(1)));
    const toolSet = [...file.toolSet];
    const spindleSet = [...file.spindleSet].map(value => Number(value.slice(1)));

    return {
        ...file,
        movementSet,
        toolSet,
        spindleSet
    };
})(IdleInfo);
