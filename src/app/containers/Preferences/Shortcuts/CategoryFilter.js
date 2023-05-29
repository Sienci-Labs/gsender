import React from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import chroma from 'chroma-js';
import {
    ALL_CATEGORY,
    CARVING_CATEGORY,
    OVERRIDES_CATEGORY,
    VISUALIZER_CATEGORY,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    PROBING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    GENERAL_CATEGORY,
    TOOLBAR_CATEGORY,
    MACRO_CATEGORY,
    COOLANT_CATEGORY,
    ALL_CATEGORIES
} from 'app/constants';
import styles from './index.styl';

const CategoryFilter = ({ onChange, filterCategory }) => {
    const getColour = (data) => {
        const categories = {
            [ALL_CATEGORY]: chroma('#edf2f4'),
            [CARVING_CATEGORY]: chroma('green').brighten(2),
            [OVERRIDES_CATEGORY]: chroma('blue').brighten(), //chroma.mix('blue', 'white'),
            [VISUALIZER_CATEGORY]: chroma('pink'),
            [LOCATION_CATEGORY]: chroma('orange').brighten(),
            [JOGGING_CATEGORY]: chroma('red').brighten(),
            [PROBING_CATEGORY]: chroma('purple').brighten(), //chroma.mix('purple', 'white'),
            [SPINDLE_LASER_CATEGORY]: chroma('black'),
            [GENERAL_CATEGORY]: chroma('grey').brighten(),
            [TOOLBAR_CATEGORY]: chroma('#778da9'),
            [MACRO_CATEGORY]: chroma('dodgerblue'),
            [COOLANT_CATEGORY]: chroma('red').darken(2)
        };

        return categories[data];
    };

    const colourStyles = {
        control: (styles) => ({ ...styles, backgroundColor: 'white', color: 'black' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            const dataColour = getColour(data.value);
            // determine whether text should be white or black
            const textValue = chroma.contrast(dataColour, 'white') > 4.5 ? 'white' : 'black';
            // determine whether colour is black/white, and therefore needs to be the opposite, or whether it can be its colour
            const textValue2 = chroma.deltaE(dataColour, 'white') === 0 ? textValue : dataColour.darken().saturate().css();
            // const focusedValue = isFocused ? dataColour.alpha(0.3).css() : undefined;

            return {
                ...styles,
                backgroundColor: isSelected ? dataColour.css() : dataColour.alpha(0.1).css(),
                color: isSelected ? textValue : textValue2,

                ':active': {
                    ...styles[':active'],
                    backgroundColor: isSelected ? dataColour.css() : dataColour.alpha(0.3).css(),
                    color: textValue,
                },

                ':hover': {
                    ...styles[':hover'],
                    backgroundColor: dataColour.css(),
                    color: textValue,
                    cursor: 'pointer',
                },
            };
        },
    };

    const filterRenderer = (option) => {
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
        <div className={styles.filterArea}>
            <div>Categories:</div>
            <div className={styles.filterSelect}>
                <Select
                    id="categorySelect"
                    backspaceRemoves={false}
                    className="sm"
                    clearable={false}
                    name="theme"
                    onChange={(category) => {
                        onChange(category.value);
                    }}
                    options={map(ALL_CATEGORIES, (value) => ({
                        value: value,
                        label: value
                    }))}
                    searchable={false}
                    value={{ label: filterCategory }}
                    valueRenderer={filterRenderer}
                    styles={colourStyles}
                />
            </div>
        </div>
    );
};

export default CategoryFilter;
