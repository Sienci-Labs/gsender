import React from 'react';
import PropTypes from 'prop-types';

import styles from './index.styl';

const TimelineItem = ({ date, text }) => {
    return (
        <div className={styles.timelineItem}>
            <div className={styles.timelineBubble}>
                {date}
            </div>
            <div className={styles.timelineText}>{text}</div>
        </div>
    );
}; TimelineItem.propTypes = { date: PropTypes.string, text: PropTypes.string };

export default TimelineItem;
