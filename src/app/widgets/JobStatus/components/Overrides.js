import React from 'react';
import PropTypes from 'prop-types';

import ProgressArea from './ProgressArea';
import SettingsArea from './SettingsArea';
import styles from './Overrides.styl';

/**
 * Override component responsible for allowing feed rate and spindle overrides as well as displaying their values
 * @prop {Object} state Default state given from parent component
 *
 */
const Overrides = ({ state }) => {
    return (
        <div className={styles.wrapper}>

            <ProgressArea state={state} />

            <div className={styles.seperator} />

            <SettingsArea state={state} />
        </div>
    );
};

Overrides.propTypes = {
    state: PropTypes.object,
};

export default Overrides;
