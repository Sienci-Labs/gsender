import React from 'react';
import PropTypes from 'prop-types';

import Visualizer from 'app/features/Visualizer';

const VisualizerComponent = ({ gcode }) => {
    return gcode ? (
        <Visualizer
            isSecondary
            widgetId="stock_turning_visualizer"
            gcode={gcode}
        />
    ) : (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid black',
            }}
        >
            Click 'Generate G-code' to see a preview
        </div>
    );
};

VisualizerComponent.propTypes = {
    gcode: PropTypes.string,
};

export default VisualizerComponent;
