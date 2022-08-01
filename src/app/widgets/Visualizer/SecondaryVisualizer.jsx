import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import * as WebGL from 'app/lib/three/WebGL';
import { SURFACING_VISUALIZER_CONTAINER_ID } from 'app/constants';

import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';

const SecondaryVisualizer = ({ state, actions, surfacingData, showVisualizer, cameraPosition, visualizerRef, showLoading, showRendering }) => {
    let visualizer = useRef();
    return (
        <div style={{ border: '1px solid black', height: '100%', width: '100%' }}>
            { showLoading && <Loading /> }
            { showRendering && <Rendering /> }

            {WebGL.isWebGLAvailable() && (
                <VisualizerWrapper
                    show={showVisualizer}
                    cameraPosition={cameraPosition}
                    ref={visualizer}
                    state={state}
                    actions={actions}
                    surfacingData={surfacingData}
                    containerID={SURFACING_VISUALIZER_CONTAINER_ID}
                    isSecondary={true}
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
