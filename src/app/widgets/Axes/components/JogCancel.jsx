import React from 'react';
import styles from '../index.styl';

const JogCancel = (props) => {
    return (
        <button
            {...props}
            className={styles.jogCancelButton}
        >
            <i className="fas fa-ban" />
        </button>
    );
};

export default JogCancel;
