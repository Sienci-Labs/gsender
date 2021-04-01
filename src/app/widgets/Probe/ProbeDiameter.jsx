import React from 'react';
import CreatableSelect from 'react-select/creatable';
import styles from './index.styl';
import { METRIC_UNITS } from '../../constants';


const convertAvailableTools = (tools, units) => {
    const optionLabels = [];

    for (let tool of tools) {
        let diameter = (units === METRIC_UNITS) ? tool.metricDiameter : tool.imperialDiameter;
        optionLabels.push({
            value: diameter,
            label: `${diameter} ${units}`
        });
    }
    return optionLabels;
};

const inputStyle = {
    container: base => ({
        ...base,
        flex: 1
    })
};

const ProbeDiameter = ({ actions, state }) => {
    const { setToolDiameter } = actions;
    const { availableTools, units, toolDiameter } = state;

    const handleChange = (value) => {
        setToolDiameter(value);
    };
    const options = convertAvailableTools(availableTools, units);

    return (
        <div>
            <label className="control-label">Tool Diameter</label>
            <div className={styles.probeDiameterWrapper}>
                <CreatableSelect
                    isClearable
                    styles={inputStyle}
                    onChange={handleChange}
                    value={{ label: `${toolDiameter} ${units}` }}
                    options={options}
                    menuPlacement="top"
                    singleValue
                />
            </div>
        </div>

    );
};

export default ProbeDiameter;
