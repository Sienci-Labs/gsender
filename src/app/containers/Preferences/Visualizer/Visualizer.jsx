import React from 'react';
import classNames from 'classnames';
import map from 'lodash/map';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Select from 'react-select';
import styles from '../index.styl';
import Fieldset from '../FieldSet';
import { DARK_THEME, LIGHT_THEME } from '../../../widgets/Visualizer/constants';


const themes = [
    DARK_THEME,
    LIGHT_THEME
];

const VisualizerSettings = ({ active, state, actions }) => {
    const { theme, objects, disabled, disabledLite } = state.visualizer;
    const visualizerActions = actions.visualizer;
    const themeRenderer = (option) => {
        const style = {
            color: '#333',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            textTransform: 'capitalize'
        };
        return (
            <div style={style} title={option.label}>{option.label}</div>
        );
    };

    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles.settingsTitle}>
                Visualizer
            </h3>
            <div className={styles.toolMain}>
                <div style={{ width: '48%' }}>
                    <Fieldset legend="Visualizer Options">
                        <div className={styles.vizGrid}>
                            <b>Option</b>
                            <b>Regular</b>
                            <b>Light-mode</b>
                            <span>Visualize G-Code</span>
                            <ToggleSwitch checked={!disabled} onChange={() => visualizerActions.handleVisEnabledToggle()} />
                            <ToggleSwitch checked={!disabledLite} onChange={() => visualizerActions.handleVisEnabledToggle(true)} />
                            <span>Drill Animation</span>
                            <ToggleSwitch checked={objects.cuttingTool.visible} onChange={() => visualizerActions.handleAnimationToggle()} />
                            <ToggleSwitch checked={objects.cuttingTool.visibleLite} onChange={() => visualizerActions.handleAnimationToggle(true)} />
                            <span>Cutpath Animation</span>
                            <ToggleSwitch checked={objects.cutPath.visible} onChange={() => visualizerActions.handleCutPathToggle()} />
                            <ToggleSwitch checked={objects.cutPath.visibleLite} onChange={() => visualizerActions.handleCutPathToggle(true)} />
                        </div>
                        <small>Specify which visualizer features are enabled or disable in both regular mode and light-mode, in order to save computer resources</small>
                    </Fieldset>
                </div>
                <div style={{ width: '48%' }}>
                    <Fieldset legend="Theme">
                        <Select
                            backspaceRemoves={false}
                            className="sm"
                            clearable={false}
                            menuContainerStyle={{ zIndex: 5 }}
                            name="theme"
                            onChange={actions.visualizer.handleThemeChange}
                            options={map(themes, (value) => ({
                                value: value,
                                label: value
                            }))}
                            searchable={false}
                            value={theme}
                            valueRenderer={themeRenderer}
                        />
                        <small>Colours used when visualizing a G-Code file.</small>
                    </Fieldset>
                </div>
            </div>
        </div>
    );
};

export default VisualizerSettings;
