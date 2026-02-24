import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FrownIcon } from 'lucide-react';
import pubsub from 'pubsub-js';

import * as WebGL from 'app/lib/three/WebGL';
import { Widget } from 'app/components/Widget';
import VisualizerWrapper from './VisualizerWrapper';
import Loading from './Loading';
import Rendering from './Rendering';
import SoftLimitsWarningArea from './SoftLimitsWarningArea';
import CameraDisplay from './CameraDisplay/CameraDisplay';
import { WorkspaceSelector } from 'app/features/WorkspaceSelector/index.tsx';
import { FaFeatherAlt } from 'react-icons/fa';
import cx from 'classnames';
import { Tooltip } from 'app/components/Tooltip';
import GcodeEditor from './GcodeEditor';
import { Actions, State } from './definitions';

interface Props {
    state: State;
    actions: Actions;
    showVisualizer: boolean;
    visualizerRef: any;
    showLoading: boolean;
    showRendering: boolean;
}

const PrimaryVisualizer = ({
    actions,
    state,
    showLoading,
    showRendering,
    showVisualizer,
    visualizerRef,
}: Props) => {
    const { cameraPosition } = state;
    const { camera } = actions;

    const [showEditor, setShowEditor] = useState(false);
    const [isEditorMounted, setIsEditorMounted] = useState(false);
    const timeoutRef = React.useRef(null);

    useEffect(() => {
        const token = pubsub.subscribe(
            'gcode-editor:toggle',
            (_, isVisible) => {
                // Clear any pending timeouts
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }

                if (isVisible) {
                    setIsEditorMounted(true);
                    // Small delay to trigger fade-in animation
                    timeoutRef.current = setTimeout(() => {
                        setShowEditor(true);
                        timeoutRef.current = null;
                    }, 10);
                } else {
                    setShowEditor(false);
                    // Wait for fade-out animation before unmounting
                    timeoutRef.current = setTimeout(() => {
                        setIsEditorMounted(false);
                        timeoutRef.current = null;
                    }, 200);
                }
            },
        );

        return () => {
            pubsub.unsubscribe(token);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const containerID = 'visualizer_container';

    return (
        <Widget className="w-full p-1 max-xl:p-0.5">
            <Widget.Content
                id={containerID}
                className="w-full bg-no-repeat bg-center"
            >
                {showLoading && (
                    <div className=" z-10 relative  w-[40vw] h-[25vh] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Loading />
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
                            <FrownIcon size={4} />
                            <span style={{ fontSize: '16px' }}>
                                {
                                    "It looks like your device doesn't support WebGL"
                                }
                            </span>
                        </div>
                    )}

                    <div className="absolute portrait:right-5 portrait:left-auto left-5 bottom-44 text-4xl text-white flex flex-col gap-2">
                        <Tooltip content="Toggle lightweight mode">
                            <button>
                                <FaFeatherAlt
                                    className={cx('cursor-pointer', {
                                        'text-gray-500': !state.liteMode,
                                    })}
                                    onClick={() =>
                                        actions.handleLiteModeToggle()
                                    }
                                />
                            </button>
                        </Tooltip>
                    </div>

                    <CameraDisplay
                        camera={camera}
                        cameraPosition={cameraPosition}
                    />
                    <WorkspaceSelector />

                    {isEditorMounted && (
                        <div
                            className={cx(
                                'absolute top-0 left-0 right-0 bottom-0 z-10 flex items-center justify-center p-4 rounded-md transition-opacity duration-200 ease-in-out',
                                {
                                    'opacity-0 pointer-events-none bg-transparent':
                                        !showEditor,
                                    'opacity-100 bg-black bg-opacity-50':
                                        showEditor,
                                },
                            )}
                        >
                            <div
                                className={cx(
                                    'w-full h-full max-w-6xl max-h-[95%] self-start transition-all duration-200 ease-in-out portrait:max-h-[85%]',
                                    {
                                        'scale-95 opacity-0': !showEditor,
                                        'scale-100 opacity-100': showEditor,
                                    },
                                )}
                            >
                                <GcodeEditor
                                    onClose={() => {
                                        pubsub.publish(
                                            'gcode-editor:toggle',
                                            false,
                                        );
                                    }}
                                />
                            </div>
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
    showLoading: PropTypes.bool,
    showRendering: PropTypes.bool,
    showVisualizer: PropTypes.bool,
    visualizerRef: PropTypes.func,
    containerID: PropTypes.string,
};

export default PrimaryVisualizer;
