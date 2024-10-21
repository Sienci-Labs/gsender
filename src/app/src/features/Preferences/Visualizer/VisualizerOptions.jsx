import React from 'react';
import classNames from 'classnames';
import Tooltip from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';

import Fieldset from '../components/Fieldset';

import styles from '../index.module.styl';

const VisualizerOptions = ({ state, actions }) => {
    const { objects, disabled, disabledLite, SVGEnabled, jobEndModal } =
        state.visualizer;
    const visualizerActions = actions.visualizer;

    return (
        <>
            <Fieldset legend="Visualizer Options">
                <div className={styles.addMargin}>
                    <div className={classNames(styles.vizGrid)}>
                        <b>Option</b>
                        <b>Regular</b>
                        <b>Lightweight Mode</b>
                        <Tooltip
                            content="Toggle rendering of your project"
                            location="default"
                        >
                            <span className={styles.vizLabel}>
                                Visualize G-Code
                            </span>
                        </Tooltip>
                        <ToggleSwitch
                            checked={!disabled}
                            onChange={() =>
                                visualizerActions.handleVisEnabledToggle()
                            }
                            size="sm"
                        />
                        <ToggleSwitch
                            checked={!disabledLite}
                            onChange={() =>
                                visualizerActions.handleVisEnabledToggle(true)
                            }
                            size="lg"
                        />
                        <Tooltip
                            content="Show the Drill Bit spinning while project runs"
                            location="default"
                        >
                            <span className={styles.vizLabel}>
                                Show Bit Animation
                            </span>
                        </Tooltip>
                        <ToggleSwitch
                            checked={objects.cuttingToolAnimation.visible}
                            onChange={() =>
                                visualizerActions.handleAnimationToggle()
                            }
                            size="md"
                        />
                        <ToggleSwitch
                            checked={objects.cuttingToolAnimation.visibleLite}
                            onChange={() =>
                                visualizerActions.handleAnimationToggle(true)
                            }
                            size="md"
                        />
                        <Tooltip
                            content="Toggle rendering of the Drill Bit"
                            location="default"
                        >
                            <span className={styles.vizLabel}>Show Bit</span>
                        </Tooltip>
                        <ToggleSwitch
                            checked={objects.cuttingTool.visible}
                            onChange={() => visualizerActions.handleBitToggle()}
                            size="md"
                        />
                        <ToggleSwitch
                            checked={objects.cuttingTool.visibleLite}
                            onChange={() =>
                                visualizerActions.handleBitToggle(true)
                            }
                            size="md"
                        />
                        <Tooltip
                            content="Show a dot in the visualizer instead of the Drill Bit"
                            location="default"
                        >
                            <span className={styles.vizLabel}>
                                Cutpath Animation
                            </span>
                        </Tooltip>
                        <ToggleSwitch
                            checked={objects.cutPath.visible}
                            onChange={() =>
                                visualizerActions.handleCutPathToggle()
                            }
                            size="md"
                        />
                        <ToggleSwitch
                            checked={objects.cutPath.visibleLite}
                            onChange={() =>
                                visualizerActions.handleCutPathToggle(true)
                            }
                            size="md"
                        />
                    </div>
                    <small>
                        Specify which visualizer features are enabled or disable
                        in both regular mode and light-mode, in order to save
                        computer resources
                    </small>
                </div>
                {/*
                                <div className={styles.flexRow}>
                    <span>Force minimal renders</span>
                    <ToggleSwitch checked={minimizeRenders} onChange={() => visualizerActions.handleMinimizeRenderToggle()} />
                </div>
                <small>This will force the visualizer to only re-render when new information is received from the controller during a job, increasing performance</small>

                    */}
            </Fieldset>
            <Fieldset legend="Lightweight Mode Options">
                <div className={classNames(styles.vizGrid)}>
                    <Tooltip
                        content="Toggle whether the Visualizer is the classic 3D grid, or a 2D SVG"
                        location="default"
                    >
                        <span className={styles.vizLabel}>
                            Enable SVG Visualizer
                        </span>
                    </Tooltip>
                    <ToggleSwitch
                        disabled={disabledLite}
                        checked={SVGEnabled}
                        onChange={() =>
                            visualizerActions.handleSVGEnabledToggle()
                        }
                        size="sm"
                    />
                </div>
            </Fieldset>
            <Fieldset legend="Job Options">
                <div className={styles.vizGrid}>
                    <Tooltip
                        content="Enable a modal that shows the details of the run when the job ends."
                        location="default"
                    >
                        <span className={styles.vizLabel}>
                            Enable Job End Pop Up
                        </span>
                    </Tooltip>
                    <ToggleSwitch
                        checked={jobEndModal}
                        onChange={() => visualizerActions.setJobEndModal()}
                        size="small"
                    />
                </div>
            </Fieldset>
        </>
    );
};

export default VisualizerOptions;
