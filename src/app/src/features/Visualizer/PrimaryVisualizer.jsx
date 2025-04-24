import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiEmoticonSadOutline } from '@mdi/js';

import * as WebGL from 'app/lib/three/WebGL';
import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_HOLD,
    WORKFLOW_STATE_IDLE,
    GRBL_ACTIVE_STATE_DOOR,
    GRBLHAL,
} from 'app/constants';
import { Widget } from 'app/components/Widget';
import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';
import { MODAL_WATCH_DIRECTORY } from './constants';
import SoftLimitsWarningArea from './SoftLimitsWarningArea';
import LoadingAnimation from './LoadingAnimation';
import CameraDisplay from './CameraDisplay/CameraDisplay';
import { WorkspaceSelector } from 'app/features/WorkspaceSelector/index.tsx';
import { Helper } from 'app/features/Helper/index';
import { FaFeatherAlt } from 'react-icons/fa';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';
import cx from 'classnames';

const PrimaryVisualizer = ({
    actions,
    state,
    capable,
    showLoading,
    showRendering,
    showVisualizer,
    visualizerRef,
    workflowRef,
    widgetContentRef,
}) => {
    const {
        liteMode,
        modal,
        cameraPosition,
        invalidLine,
        invalidGcode,
        alarmCode,
        activeState,
        workflow,
        isConnected,
        controller,
    } = state;
    const isHomingAlarm =
        activeState === GRBL_ACTIVE_STATE_ALARM && alarmCode === 'Homing'; // We are alarmed and
    const holdWithoutWorkflowPause =
        activeState === GRBL_ACTIVE_STATE_HOLD &&
        workflow.state === WORKFLOW_STATE_IDLE;
    const doorOpen = activeState === GRBL_ACTIVE_STATE_DOOR;
    const showUnlockButton =
        isConnected && (doorOpen || isHomingAlarm || holdWithoutWorkflowPause);
    const { handleLiteModeToggle, handleRun, reset, camera } = actions;

    const containerID = 'visualizer_container';

    return (
        <Widget className="w-full p-1">
            <Widget.Content id={containerID} className="w-full">
                {showLoading && (
                    <div className="z-10 relative bg-gray-100 dark:bg-dark w-[40vw] h-[25vh] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Loading />
                        <LoadingAnimation />
                    </div>
                )}

                {showRendering && <Rendering />}

                <div className="h-full w-full absolute top-0 left-0">
                    <SoftLimitsWarningArea />
                    {WebGL.isWebGLAvailable() ? (
                        <VisualizerWrapper
                            show={showVisualizer}
                            cameraPosition={cameraPosition}
                            ref={visualizerRef}
                            state={state}
                            actions={actions}
                            containerID={containerID}
                            isSecondary={false}
                        />
                    ) : (
                        <div>
                            <Icon path={mdiEmoticonSadOutline} size={4} />
                            <span style={{ fontSize: '16px' }}>
                                {
                                    "It looks like your device doesn't support WebGL"
                                }
                            </span>
                        </div>
                    )}

                    <div className="absolute left-5 bottom-44 text-4xl text-white flex flex-col gap-2">
                        <FaFeatherAlt
                            className={cx('cursor-pointer', {
                                'text-gray-500': !state.liteMode,
                            })}
                            onClick={() => actions.handleLiteModeToggle()}
                        />
                        <FiZoomIn
                            className="cursor-pointer"
                            onClick={() => actions.camera.zoomIn()}
                        />
                        <FiZoomOut
                            className="cursor-pointer"
                            onClick={() => actions.camera.zoomOut()}
                        />
                    </div>

                    <CameraDisplay
                        camera={camera}
                        cameraPosition={cameraPosition}
                    />
                    <Helper />
                    <WorkspaceSelector />
                </div>
            </Widget.Content>
        </Widget>
    );
};

PrimaryVisualizer.propTypes = {
    actions: PropTypes.object,
    state: PropTypes.object,
    capable: PropTypes.object,
    showLoading: PropTypes.bool,
    showRendering: PropTypes.bool,
    showVisualizer: PropTypes.bool,
    visualizerRef: PropTypes.func,
    workflowRef: PropTypes.func,
    widgetContentRef: PropTypes.func,
    containerID: PropTypes.string,
};

export default PrimaryVisualizer;
