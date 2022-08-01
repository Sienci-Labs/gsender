import React from 'react';
import reduxStore from 'app/store/redux';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';

import Fieldset from '../components/Fieldset';

import styles from '../index.styl';

const VisualizerSafety = ({ state, actions }) => {
    const { showSoftLimitsWarning } = state.visualizer;
    const visualizerActions = actions.visualizer;
    const $20 = parseInt(reduxStore.getState().controller.settings.settings ? reduxStore.getState().controller.settings.settings.$20 : 0, 10);

    return (
        <Fieldset legend="Visualizer">
            <div className={styles.addMargin}>
                <Tooltip content="Show warning when current workspace 0 will cause the machine to cut outside of soft limits" location="default">
                    <ToggleSwitch
                        label="Show Soft Limits Warning"
                        checked={showSoftLimitsWarning}
                        disabled={$20 === 0}
                        onChange={() => visualizerActions.handleLimitsWarningToggle()}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default VisualizerSafety;
