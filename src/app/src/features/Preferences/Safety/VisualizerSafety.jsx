import React from 'react';
import reduxStore from 'app/store/redux';
import Tooltip from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';

import Fieldset from '../components/Fieldset';

import styles from '../index.module.styl';

const VisualizerSafety = ({ state, actions }) => {
    const { showSoftLimitsWarning } = state.visualizer;
    const visualizerActions = actions.visualizer;
    const $20 = parseInt(
        reduxStore.getState().controller.settings.settings
            ? reduxStore.getState().controller.settings.settings.$20
            : 0,
        10,
    );

    return (
        <Fieldset legend="Visualizer">
            <div className={styles.addMargin}>
                <Tooltip
                    content="Show warning when WCS Zero would exceed configured Soft Limits on current toolpath.  Soft limits ($20) must be enabled."
                    location="default"
                >
                    <ToggleSwitch
                        label="Show Soft Limits Warning"
                        checked={showSoftLimitsWarning}
                        disabled={$20 === 0}
                        onChange={() =>
                            visualizerActions.handleLimitsWarningToggle()
                        }
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default VisualizerSafety;
