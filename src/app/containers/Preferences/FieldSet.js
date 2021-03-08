import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './index.styl';

const FieldSet = ({ children, legend, className }) => {
    return (
        <fieldset className={classnames(styles.fieldset, className)}>
            <legend className={styles.fieldsetLegend}>{legend}</legend>
            {children}
        </fieldset>
    );
};

FieldSet.propTypes = {
    legend: PropTypes.string,
    className: PropTypes.string,
};

export default FieldSet;
