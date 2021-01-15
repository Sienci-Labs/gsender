import PropTypes from 'prop-types';
import React from 'react';
import DisplayPanel from './DisplayPanel';
import Keypad from './Keypad';
import MDI from './MDI';

const Axes = (props) => {
    const {
        state,
        actions,
        xyDistance,
        zdistance,
        setSpeed,
        userHasNStops,
        jogDistance,
        metricMaxDistance
    } = props;

    return (
        <div>
            <DisplayPanel
                canClick={state.canClick}
                units={state.units}
                axes={state.axes}
                machinePosition={state.machinePosition}
                workPosition={state.workPosition}
                jog={state.jog}
                actions={actions}
            />
            <Keypad
                canClick={state.canClick}
                units={state.units}
                axes={state.axes}
                jog={state.jog}
                actions={actions}
                xyDistance={xyDistance}
                zdistance={zdistance}
                setSpeed={setSpeed}
                userHasNStops={userHasNStops}
                jogDistance={jogDistance}
                metricMaxDistance={metricMaxDistance}
            />
            <MDI
                canClick={state.canClick}
                mdi={state.mdi}
            />
        </div>
    );
};

Axes.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
    xyDistance: PropTypes.number,
    zdistance: PropTypes.number,
    setSpeed: PropTypes.number,
    userHasNStops: PropTypes.bool,
    jogDistance: PropTypes.number,
    metricMaxDistance: PropTypes.number
};

export default Axes;
