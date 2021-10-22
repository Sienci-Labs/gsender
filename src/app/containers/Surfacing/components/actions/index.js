import React from 'react';
import PropTypes from 'prop-types';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';

import styles from './index.styl';

const Actions = ({ handleGenerateGcode, handleLoadGcode, surfacing, canLoad }) => {
    const canGenerateGcode = Object.keys(surfacing).every(key => surfacing[key]);

    return (
        <div className={styles.container}>
            <ToolModalButton
                icon="fas fa-code"
                disabled={!canGenerateGcode}
                style={{ margin: 0 }}
                onClick={handleGenerateGcode}
            >
                Generate G-code
            </ToolModalButton>

            <ToolModalButton
                icon="fas fa-play"
                disabled={!canLoad}
                style={{ margin: 0 }}
                onClick={handleLoadGcode}
            >
                Run on Main Visualizer
            </ToolModalButton>
        </div>
    );
};

Actions.propTypes = {
    handleGenerateGcode: PropTypes.func,
    handleLoadGcode: PropTypes.func,
    surfacing: PropTypes.object,
    canLoad: PropTypes.bool,
};

export default Actions;
