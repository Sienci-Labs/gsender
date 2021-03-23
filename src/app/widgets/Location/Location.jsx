import PropTypes from 'prop-types';
import React from 'react';
import DisplayPanel from './DisplayPanel';

const Location = (props) => {
    const { state, actions } = props;

    return (
        <DisplayPanel
            canClick={state.canClick}
            units={state.units}
            axes={state.axes}
            machinePosition={state.machinePosition}
            workPosition={state.workPosition}
            jog={state.jog}
            actions={actions}
            safeRetractHeight={state.safeRetractHeight}
        />
    );
};

Location.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object
};

export default Location;
