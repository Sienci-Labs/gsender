import React from 'react';

import styles from './index.styl';

const TimelineArrow = () => {
    return (
        <div className={styles.arrow}>
            <div className={styles.body} />
            <div className={styles.head} />
        </div>
    );
};

export default TimelineArrow;
