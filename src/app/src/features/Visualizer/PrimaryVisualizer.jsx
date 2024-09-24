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
// import ToggleSwitch from 'app/components/ToggleSwitch';
// import UnlockButton from 'app/widgets/Visualizer/UnlockButton';
// import WorkflowControl from './WorkflowControl';
// import MachineStatusArea from './MachineStatusArea';
// import ValidationModal from './ValidationModal';
// import WarningModal from './WarningModal';
import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';
// import WatchDirectory from './WatchDirectory';
import { MODAL_WATCH_DIRECTORY } from './constants';
import SoftLimitsWarningArea from './SoftLimitsWarningArea';
import LoadingAnimation from './LoadingAnimation';

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
    const { handleLiteModeToggle, handleRun, reset } = actions;

    const containerID = 'visualizer_container';

    return (
        <Widget className="w-full p-1">
            <Widget.Content id={containerID} className="w-full">
                {showLoading && (
                    <div>
                        <Loading />
                        <LoadingAnimation />
                    </div>
                )}
                {showRendering && <Rendering />}

                <div className="h-full w-full absolute top-0 left-0 p-2">
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
