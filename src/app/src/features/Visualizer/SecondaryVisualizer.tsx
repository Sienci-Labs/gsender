import PropTypes from 'prop-types';

import * as WebGL from 'app/lib/three/WebGL';
import { SURFACING_VISUALIZER_CONTAINER_ID } from 'app/constants';

import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';
import CameraDisplay from './CameraDisplay/CameraDisplay';

import cx from 'classnames';
import { Actions, CAMERA_MODES_T, State } from './definitions';

interface Props {
    state: State;
    actions: Actions;
    showVisualizer: boolean;
    cameraPosition: CAMERA_MODES_T;
    visualizerRef: any;
    showLoading: boolean;
    showRendering: boolean;
}

const SecondaryVisualizer = ({
    state,
    actions,
    showVisualizer,
    visualizerRef,
    showLoading,
    showRendering,
}: Props) => {
    const { cameraPosition } = state;
    const { camera } = actions;
    return (
        <>
            <div
                className={cx(
                    'z-10 absolute w-[40vw] h-[25vh] top-1/2 right-1/4 translate-x-1/4 -translate-y-1/2',
                    {
                        hidden: !showLoading && !showRendering,
                    },
                )}
            >
                {showLoading && <Loading />}
                {showRendering && <Rendering />}
            </div>

            {WebGL.isWebGLAvailable() && (
                <>
                    <VisualizerWrapper
                        show={showVisualizer}
                        cameraPosition={cameraPosition}
                        ref={visualizerRef}
                        state={state}
                        actions={actions}
                        containerID={SURFACING_VISUALIZER_CONTAINER_ID}
                        isSecondary={true}
                    />
                    <CameraDisplay
                        camera={camera}
                        cameraPosition={cameraPosition}
                    />
                </>
            )}
        </>
    );
};

SecondaryVisualizer.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
    showVisualizer: PropTypes.bool,
    visualizerRef: PropTypes.func,
    showLoading: PropTypes.bool,
    showRendering: PropTypes.bool,
};

export default SecondaryVisualizer;
