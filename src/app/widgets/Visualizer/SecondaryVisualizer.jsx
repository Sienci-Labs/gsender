import React from 'react';
import PropTypes from 'prop-types';

import * as WebGL from 'app/lib/three/WebGL';
import { SURFACING_VISUALIZER_CONTAINER_ID } from 'app/constants';

import Visualizer from './Visualizer';
import Loading from './Loading';
import Rendering from './Rendering';

const SecondaryVisualizer = ({ state, actions, surfacingData, showVisualizer, cameraPosition, visualizerRef, showLoading, showRendering }) => {
    return (
        <div style={{ border: '1px solid black', height: 'calc(100% - 28px)', width: '100%' }}>
            { showLoading && <Loading /> }
            { showRendering && <Rendering /> }

            {WebGL.isWebGLAvailable() && (
                <Visualizer
                    isSecondary
                    show={showVisualizer}
                    cameraPosition={cameraPosition}
                    ref={visualizerRef}
                    state={state}
                    actions={actions}
                    surfacingData={surfacingData}
                    containerID={SURFACING_VISUALIZER_CONTAINER_ID}
                />
            )}
        </div>
    );
};

SecondaryVisualizer.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
    gcode: PropTypes.string,
    surfacingData: PropTypes.object,
    cameraPosition: PropTypes.string,
    showVisualizer: PropTypes.bool,
    visualizerRef: PropTypes.func,
    containerID: PropTypes.string,
    showLoading: PropTypes.bool,
    showRendering: PropTypes.bool,
};

export default SecondaryVisualizer;
