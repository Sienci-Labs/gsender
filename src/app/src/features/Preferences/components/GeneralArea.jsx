import React from 'react';
import styles from '../index.module.styl';

const Half = ({ children }) => {
    return <div className={styles.halfContainer}>{children}</div>;
};

const GeneralArea = ({ children }) => {
    return <div className={styles.generalArea}>{children}</div>;
};

GeneralArea.Half = Half;

export default GeneralArea;
