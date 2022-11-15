import React, { useState } from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import { useSelector } from 'react-redux';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import {
    CUSTOMIZABLE_THEMES, ALL_THEMES,
    BACKGROUND_PART, GRID_PART, XAXIS_PART, YAXIS_PART, ZAXIS_PART,
    LIMIT_PART, CUTTING_PART, JOGGING_PART, G0_PART, G1_PART
}
from 'app/widgets/Visualizer/constants';
import pubsub from 'pubsub-js';
import Fieldset from '../components/Fieldset';
import ColorPicker from '../components/ColorPicker';
import ColorCircle from '../components/ColorCircle';

import styles from '../index.styl';

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
    G1_PART
];

const Theme = ({ state, actions }) => {
    const { theme } = state.visualizer;
    const [isOpen, setIsOpen] = useState(false);
    const [currentPart, setCurrentPart] = useState(BACKGROUND_PART);
    const fileLoaded = useSelector(store => store.file.fileLoaded);

    const getThemeColours = (theme) => {
        return (
            new Map([
                [BACKGROUND_PART, actions.visualizer.getCurrentColor(theme, BACKGROUND_PART, actions.visualizer.getDefaultColour(BACKGROUND_PART))],
                [GRID_PART, actions.visualizer.getCurrentColor(theme, GRID_PART, actions.visualizer.getDefaultColour(GRID_PART))],
                [XAXIS_PART, actions.visualizer.getCurrentColor(theme, XAXIS_PART, actions.visualizer.getDefaultColour(XAXIS_PART))],
                [YAXIS_PART, actions.visualizer.getCurrentColor(theme, YAXIS_PART, actions.visualizer.getDefaultColour(YAXIS_PART))],
                [ZAXIS_PART, actions.visualizer.getCurrentColor(theme, ZAXIS_PART, actions.visualizer.getDefaultColour(ZAXIS_PART))],
                [LIMIT_PART, actions.visualizer.getCurrentColor(theme, LIMIT_PART, actions.visualizer.getDefaultColour(LIMIT_PART))],
                [CUTTING_PART, actions.visualizer.getCurrentColor(theme, CUTTING_PART, actions.visualizer.getDefaultColour(CUTTING_PART))],
                [JOGGING_PART, actions.visualizer.getCurrentColor(theme, JOGGING_PART, actions.visualizer.getDefaultColour(JOGGING_PART))],
                [G0_PART, actions.visualizer.getCurrentColor(theme, G0_PART, actions.visualizer.getDefaultColour(G0_PART))],
                [G1_PART, actions.visualizer.getCurrentColor(theme, G1_PART, actions.visualizer.getDefaultColour(G1_PART))],
            ])
        );
    };

    const [themeColours, setThemeColours] = useState(getThemeColours(theme));

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

    const openModal = (part) => {
        setCurrentPart(part);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const chooseColour = (colour) => {
        let newThemeColours = themeColours;
        newThemeColours.set(currentPart, colour.hex ? colour.hex : colour);
        setThemeColours(newThemeColours);
        let data = {
            currentPart: currentPart,
            newColour: colour
        };
        pubsub.publish('colour:change', data);
    };

    return (
        <>
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
                            onChange={(value) => {
                                actions.visualizer.handleThemeChange(value);
                                setThemeColours(getThemeColours(value.value));
                            }}
                            options={map(ALL_THEMES, (value) => ({
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
            </Fieldset>
            { CUSTOMIZABLE_THEMES.includes(theme) && !fileLoaded &&
                <Fieldset legend="Colours">
                    <div className={styles.addMargin}>
                        <Tooltip content="Save your changes" location="default">
                            <button
                                className={styles.saveColour}
                                type="button"
                                onClick={() => {
                                    actions.visualizer.handleCustThemeChange(themeColours, theme);
                                }}
                            >
                            Save
                            </button>
                        </Tooltip>
                        <Tooltip content="Click on the colour circles to change the colour for that component" location="default">
                            {
                                parts.map((value, i) => {
                                    let title = value;
                                    if (title === G1_PART) {
                                        title = 'G1-G3';
                                    } else if (title === CUTTING_PART) {
                                        title = 'Cutting Coord Lines';
                                    } else if (title === JOGGING_PART) {
                                        title = 'Jogging Coord Lines';
                                    }
                                    return (
                                        <div key={theme + i} className={styles.colorContainer}>
                                            <span className={styles.first}>{title}</span>
                                            <div className={styles.dotsV2}></div>
                                            <div role="button" className={styles.colorDisplay} onClick={() => openModal(value)} tabIndex={0}>
                                                <span>{themeColours.get(value)}</span>
                                                <ColorCircle part={value} colour={themeColours.get(value)} index={i}/>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </Tooltip>
                    </div>
                    <ColorPicker actions={actions} theme={theme} part={currentPart} isOpen={isOpen} onClose={closeModal} chooseColour={chooseColour} />
                </Fieldset>
            }
            {
                fileLoaded && (<p className={styles.disabledMessage}>Unload file in the visualizer to edit the theme</p>)
            }
        </>
    );
};

export default Theme;
