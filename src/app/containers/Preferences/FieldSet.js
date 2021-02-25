import React from 'react';

import styles from './index.styl';

const FieldSet = ({ children, legend }) => {
    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.fieldsetLegend}>{legend}</legend>
            {children}
        </fieldset>
    );
};

export default FieldSet;
