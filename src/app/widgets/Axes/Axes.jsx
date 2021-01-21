import PropTypes from 'prop-types';
import React from 'react';
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
        metricXYMaxDistance,
        imperialXYMaxDistance,
        zMaxMovementMetric,
        zMaxMovementImperial,
        maxSpindleSpeed,
        maxheadSpeed,
        clicked,
        units
    } = props;

    return (
        <div>
            <Keypad
                canClick={state.canClick}
                axes={state.axes}
                jog={state.jog}
                actions={actions}
                xyDistance={xyDistance}
                zdistance={zdistance}
                setSpeed={setSpeed}
                userHasNStops={userHasNStops}
                jogDistance={jogDistance}
                metricMaxDistance={metricXYMaxDistance}
                imperialMaxDistance={imperialXYMaxDistance}
                zMaxMovementMetric={zMaxMovementMetric}
                zMaxMovementImperial={zMaxMovementImperial}
                maxSpindleSpeed={maxSpindleSpeed}
                maxheadSpeed={maxheadSpeed}
                clicked={clicked}
                units={units}
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
    metricXYMaxDistance: PropTypes.number,
    imperialXYMaxDistance: PropTypes.number,
    zMaxMovementMetric: PropTypes.number,
    zMaxMovementImperial: PropTypes.number,
    maxSpindleSpeed: PropTypes.number,
    maxheadSpeed: PropTypes.number,
    clicked: PropTypes.bool,
    units: PropTypes.string,
};

export default Axes;
