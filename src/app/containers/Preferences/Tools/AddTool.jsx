import React from 'react';
// import classnames from 'classnames';
// import { RadioGroup, RadioButton } from 'app/components/Radio';

// import Fieldset from '../FieldSet';
import Input from '../Input';

import styles from '../index.styl';

const AddTool = ({ actions, state }) => {
    const { tool } = state;
    const toolActions = actions.tool;

    return (
        <div>
            {/* <Fieldset legend="Add New Tool"> */}
            <Input
                label="Metric Diameter"
                units="mm"
                value={tool.metricDiameter}
                onChange={toolActions.setMetricDiameter}
                additionalProps={{ id: 'metricDiameter', type: 'number', step: '0.1' }}
            />

            <Input
                label="Imperial Diameter"
                units="in"
                additionalProps={{ id: 'imperialDiameter', type: 'number', step: '0.1' }}
                value={tool.imperialDiameter}
                onChange={toolActions.setImperialDiameter}
            />


            <button
                className={styles.addTool}
                type="button"
                onClick={toolActions.addTool}
                disabled={tool.imperialDiameter === 0 || tool.metricDiameter === 0}
            >
                Add Tool
            </button>
        </div>
    );
};

export default AddTool;
