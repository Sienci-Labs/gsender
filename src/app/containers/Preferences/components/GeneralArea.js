import React from 'react';
import styles from '../index.styl';

const Half = ({ children }) => {
    return (
        <div
            className={styles.halfContainer}
            style={{ justifyContent: children.length > 2 ? 'space-between' : 'flex-start' }}
        >
            { children }
        </div>
    );
};

const GeneralArea = ({ children }) => {
    return (
        <div className={styles.generalArea}>
            {children}
        </div>
    );
};

GeneralArea.Half = Half;

export default GeneralArea;
