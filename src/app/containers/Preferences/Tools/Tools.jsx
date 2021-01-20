import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import Tool from './Tool';
import AddTool from './AddTool';


const ToolSettings = ({ active, state, actions }) => {
    const { tools } = state;
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >
            <h3>
                Tools
            </h3>
            <div className={styles.toolMain}>
                <div className={styles.toolListings}>
                    <h4>Available Tools</h4>
                    <div className={styles.tools}>
                        {
                            tools.map((tool, index) => (
                                <Tool key={`tool-${index}`} {...tool} />
                            ))
                        }
                    </div>
                </div>
                <div className={styles.addToolForm}>
                    <h4>Add New Tool</h4>
                    <AddTool actions={actions} state={state} />
                </div>
            </div>
        </div>
    );
};

export default ToolSettings;
