import React, { useState } from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import { useSelector } from 'react-redux';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { DARK_THEME, LIGHT_THEME, CUST_DARK_THEME, CUST_LIGHT_THEME,
    BACKGROUND_PART, GRID_PART, XAXIS_PART, YAXIS_PART, ZAXIS_PART,
    LIMIT_PART, CUTTING_PART, JOGGING_PART, G0_PART, G1_PART, G2_PART, G3_PART }
from 'app/widgets/Visualizer/constants';
import Fieldset from '../components/Fieldset';
import ColorPicker from '../components/ColorPicker';

import styles from '../index.styl';

const themes = [
    DARK_THEME,
    LIGHT_THEME,
    CUST_DARK_THEME,
    CUST_LIGHT_THEME
];

const parts = [
    BACKGROUND_PART,
    GRID_PART,
    XAXIS_PART,
    YAXIS_PART,
    ZAXIS_PART,
    LIMIT_PART,
    CUTTING_PART,
    JOGGING_PART,
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
];

const Theme = ({ state, actions }) => {
    const { theme } = state.visualizer;
    const [part, setPart] = useState({
        value: BACKGROUND_PART,
        label: BACKGROUND_PART
    });
    const fileLoaded = useSelector(store => store.file.fileLoaded);

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
        <Fieldset legend="Theme">
            <Tooltip content="Toggle the main colour of the Visualizer" location="default">
                <div className={styles.addMargin}>
                    <Select
                        id="themeSelect"
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
                        value={{ label: theme }}
                        valueRenderer={themeRenderer}
                        isDisabled={fileLoaded}
                    />
                    <small>Colours used when visualizing a G-Code file.</small>
                </div>
            </Tooltip>
            <Tooltip content="Toggle the part of the Visualizer to customize" location="default">
                {(theme === CUST_DARK_THEME || theme === CUST_LIGHT_THEME) && (
                    <div className={styles.addMargin}>
                        <Select
                            id="partSelect"
                            backspaceRemoves={false}
                            className="sm"
                            clearable={false}
                            menuContainerStyle={{ zIndex: 5 }}
                            name="part"
                            onChange={(part) => {
                                setPart(part);
                                actions.visualizer.handlePartChange();
                            }}
                            options={map(parts, (value) => ({
                                value: value,
                                label: value
                            }))}
                            searchable={false}
                            value={{ label: part.value }}
                            valueRenderer={themeRenderer}
                            isDisabled={fileLoaded}
                        />
                        <small>Choose which part to customize.</small>
                    </div>
                )}
            </Tooltip>
            {
                !fileLoaded
                    ? <ColorPicker actions={actions} theme={theme} part={part} />
                    : (<p className={styles.disabledMessage}>Unload file in the visualizer to edit the theme</p>)
            }
        </Fieldset>
    );
};

export default Theme;
