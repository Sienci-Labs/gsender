import React from 'react';
import classNames from 'classnames';
import reduxStore from 'app/store/redux';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';

import Fieldset from '../components/Fieldset';

import styles from '../index.styl';

const VisualizerOptions = ({ state, actions }) => {
    const { showSoftLimitsWarning, objects, disabled, disabledLite } = state.visualizer;
    const visualizerActions = actions.visualizer;
    const $20 = parseInt(reduxStore.getState().controller.settings.settings.$20, 10);

    return (
        <Fieldset legend="Visualizer Options">
            <div className={styles.addMargin}>
                <div className={classNames(styles.vizGrid)}>
                    <b>Option</b>
                    <b>Regular</b>
                    <b>Lightweight Mode</b>
                    <Tooltip content="Toggle rendering of your project" location="default">
                        <span>Visualize G-Code</span>
                    </Tooltip>
                    <ToggleSwitch checked={!disabled} onChange={() => visualizerActions.handleVisEnabledToggle()} size="sm" />
                    <ToggleSwitch checked={!disabledLite} onChange={() => visualizerActions.handleVisEnabledToggle(true)} size="lg" />
                    <Tooltip content="Show the Drill Bit spinning while project runs" location="default">
                        <span>Show Bit Animation</span>
                    </Tooltip>
                    <ToggleSwitch checked={objects.cuttingToolAnimation.visible} onChange={() => visualizerActions.handleAnimationToggle()} size="md" />
                    <ToggleSwitch checked={objects.cuttingToolAnimation.visibleLite} onChange={() => visualizerActions.handleAnimationToggle(true)} size="md" />
                    <Tooltip content="Toggle rendering of the Drill Bit" location="default">
                        <span>Show Bit</span>
                    </Tooltip>
                    <ToggleSwitch checked={objects.cuttingTool.visible} onChange={() => visualizerActions.handleBitToggle()} size="md" />
                    <ToggleSwitch checked={objects.cuttingTool.visibleLite} onChange={() => visualizerActions.handleBitToggle(true)} size="md" />
                    <Tooltip content="Show a dot in the visualizer instead of the Drill Bit" location="default">
                        <span>Cutpath Animation</span>
                    </Tooltip>
                    <ToggleSwitch checked={objects.cutPath.visible} onChange={() => visualizerActions.handleCutPathToggle()} size="md" />
                    <ToggleSwitch checked={objects.cutPath.visibleLite} onChange={() => visualizerActions.handleCutPathToggle(true)} size="md" />
                    <Tooltip content="Show warning when current workspace 0 will cause the machine to cut outside of soft limits" location="default">
                        <span>Show Soft Limits Warning</span>
                    </Tooltip>
                    <ToggleSwitch checked={showSoftLimitsWarning} disabled={$20 === 0} onChange={() => visualizerActions.handleLimitsWarningToggle()} size="md" />
                </div>
                <small>Specify which visualizer features are enabled or disable in both regular mode and light-mode, in order to save computer resources</small>
            </div>
            {
                /*
                            <div className={styles.flexRow}>
                <span>Force minimal renders</span>
                <ToggleSwitch checked={minimizeRenders} onChange={() => visualizerActions.handleMinimizeRenderToggle()} />
            </div>
            <small>This will force the visualizer to only re-render when new information is received from the controller during a job, increasing performance</small>

                 */
            }

        </Fieldset>
    );
};

export default VisualizerOptions;
