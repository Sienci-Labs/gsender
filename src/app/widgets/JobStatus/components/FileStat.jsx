import React from 'react';
import styles from './IdleInfo.styl';

const FileStat = ({ label, children }) => {
    return (
        <div className={styles.fileStat}>
            <div className={styles.fileStatContainer}>
                <div className={styles.fileStatContent}>{children}</div>
                <div className={styles.fileStatLabel}>{label}</div>
            </div>

        </div>
    );
};

export default FileStat;
