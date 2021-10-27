import React from 'react';
import PropTypes from 'prop-types';

import Visualizer from 'app/widgets/Visualizer';

const VisualizerComponent = ({ gcode, surfacing }) => {
    return gcode
        ? (
            <Visualizer
                isSecondary
                widgetId="surfacing_visualizer"
                gcode={gcode}
                surfacingData={surfacing}
            />
        )
        : (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid black' }}>
                Click Generate G-code Below
            </div>
        );
};

VisualizerComponent.propTypes = {
    gcode: PropTypes.string,
    surfacing: PropTypes.object,
};

export default VisualizerComponent;
