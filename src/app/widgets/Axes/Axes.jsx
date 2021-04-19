import PropTypes from 'prop-types';
import React from 'react';
import Keypad from './Keypad';
import SpeedControls from './SpeedControls';
import styles from './index.styl';

const Axes = (props) => {
    const { state, actions } = props;
    return (
        <div className={styles.jogWidget}>
            <Keypad
                canClick={state.canClick}
                units={state.units}
                axes={state.axes}
                jog={state.jog}
                actions={actions}
                isJogging={state.isJogging}
                activeState={state.activeState}
                selectedSpeed={state.selectedSpeed}
            />
            <SpeedControls state={state} actions={actions} />
        </div>
    );
};

Axes.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object
};

export default Axes;
