import React from 'react';
import PropTypes from 'prop-types';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';

const Actions = ({ handleCancel, handleClear, handleGenerateGcode, handleLoadGcode, surfacing, canLoad }) => {
    const canGenerateGcode = Object.keys(surfacing).every(key => surfacing[key]);

    return (
        <div className={styles.container}>
            <FunctionButton onClick={handleCancel}>Cancel</FunctionButton>
            <FunctionButton onClick={handleClear}>Clear G-code</FunctionButton>
            <FunctionButton primary onClick={handleGenerateGcode} disabled={!canGenerateGcode}>Generate G-code</FunctionButton>
            <FunctionButton primary disabled={!canLoad} onClick={handleLoadGcode}>Run on Main Visualizer</FunctionButton>
        </div>
    );
};

Actions.propTypes = {
    handleCancel: PropTypes.func,
    handleClear: PropTypes.func,
    handleGenerateGcode: PropTypes.func,
    handleLoadGcode: PropTypes.func,
    surfacing: PropTypes.object,
    canLoad: PropTypes.bool,
};

export default Actions;
