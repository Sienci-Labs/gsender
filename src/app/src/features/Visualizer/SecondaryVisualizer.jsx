import React from 'react';
import PropTypes from 'prop-types';

import * as WebGL from 'app/lib/three/WebGL';
import { SURFACING_VISUALIZER_CONTAINER_ID } from 'app/constants';

import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';

const SecondaryVisualizer = ({
    state,
    actions,
    showVisualizer,
    cameraPosition,
    visualizerRef,
    showLoading,
    showRendering,
}) => {
    return (
        <>
            <div className="z-10 absolute w-[40vw] h-[25vh] top-1/2 right-1/4 translate-x-1/4 -translate-y-1/2">
                {showLoading && <Loading />}
                {showRendering && <Rendering />}
            </div>

            {WebGL.isWebGLAvailable() && (
                <VisualizerWrapper
                    show={showVisualizer}
                    cameraPosition={cameraPosition}
                    ref={visualizerRef}
                    state={state}
                    actions={actions}
                    containerID={SURFACING_VISUALIZER_CONTAINER_ID}
                    isSecondary={true}
                />
            )}
        </>
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
