import React from 'react';
import classnames from 'classnames';
import { RadioGroup, RadioButton } from 'app/components/Radio';

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

            <div className={classnames(styles.flex, styles['justify-content-space-between'])}>
                <label htmlFor="bitType">Tool Type</label>

                <RadioGroup
                    depth={2}
                    onChange={(value, event) => toolActions.setToolType(value)}
                >
                    <div>
                        <RadioButton label="End Mill" value="end mill" />
                        <RadioButton label="V Bit" value="v bit" />
                    </div>
                </RadioGroup>
            </div>

            <button
                className={styles.addTool}
                type="button"
                onClick={toolActions.addTool}
                disabled={tool.imperialDiameter === 0 || tool.metricDiameter === 0}
            >
                Add Tool
            </button>
            {/* </Fieldset> */}

            {/* <div className="form-group">
                <label htmlFor="metricDiameter">Metric Diameter (mm)</label>
                <input
                    type="number"
                    step=".01"
                    className="form-control"
                    id="metricDiameter"
                    value={tool.metricDiameter}
                    onChange={toolActions.setMetricDiameter}
                />
            </div>
            <div className="form-group">
                <label htmlFor="metricDiameter">Imperial Diameter (in)</label>
                <input
                    type="number"
                    step=".01"
                    className="form-control"
                    id="imperialDiameter"
                    value={tool.imperialDiameter}
                    onChange={toolActions.setImperialDiameter}
                />
            </div> */}

            {/* <div className="form-group">
                <label htmlFor="bitType">Tool Type</label>
                <select id="bitType" className="form-control" onChange={toolActions.setToolType}>
                    <option value="end mill">End Mill</option>
                    <option value="v bit">V Bit</option>
                </select>
            </div> */}
        </div>
    );
};

export default AddTool;
