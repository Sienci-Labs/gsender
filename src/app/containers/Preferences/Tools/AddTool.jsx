import React from 'react';
import styles from '../index.styl';

const AddTool = ({ actions, state }) => {
    const { tool } = state;
    const toolActions = actions.tool;

    return (
        <div className={styles.addTool}>
            <form>
                <div className="form-group">
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
                </div>
                <div className="form-group">
                    <label htmlFor="bitType">Tool Type</label>
                    <select id="bitType" className="form-control" onChange={toolActions.setToolType}>
                        <option value="end mill">End Mill</option>
                        <option value="v bit">V Bit</option>
                    </select>
                </div>

                <button className={styles.addTool} type="button" onClick={toolActions.addTool}>
                    Add Tool
                </button>
            </form>
        </div>
    );
};

export default AddTool;
