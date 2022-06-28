import React from 'react';
import Select from 'react-select';
import map from 'lodash/map';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { DARK_THEME, LIGHT_THEME, CUST_DARK_THEME, CUST_LIGHT_THEME } from 'app/widgets/Visualizer/constants';

import Fieldset from '../components/Fieldset';
import ColorPicker from '../components/ColorPicker';

import styles from '../index.styl';

const themes = [
    DARK_THEME,
    LIGHT_THEME,
    CUST_DARK_THEME,
    CUST_LIGHT_THEME
];

const Theme = ({ state, actions }) => {
    const { theme } = state.visualizer;
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
        <Tooltip content="Toggle the main colour of the Visualizer" location="default">
            <Fieldset legend="Theme">
                <div className={styles.addMargin}>
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
                        value={{ label: theme }}
                        valueRenderer={themeRenderer}
                    />
                    <small>Colours used when visualizing a G-Code file.</small>
                </div>
                <ColorPicker state={state} actions={actions} />
            </Fieldset>
        </Tooltip>
    );
};

export default Theme;
