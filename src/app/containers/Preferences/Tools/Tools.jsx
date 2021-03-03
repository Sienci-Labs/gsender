import React from 'react';
// import classNames from 'classnames';
import styles from '../index.styl';
import Tool from './Tool';
import AddTool from './AddTool';
import Fieldset from '../FieldSet';


const ToolSettings = ({ active, state, actions }) => {
    const { tools } = state;
    const toolActions = actions.tool;
    return (
        // <div className={classNames(
        //     styles.hidden,
        //     styles['settings-wrapper'],
        //     { [styles.visible]: active }
        // )}
        // >
        //     <h3 className={styles['settings-title']}>
        //         Tools
        //     </h3>
        <div className={styles.generalArea}>
            {/* <div style={{ width: '50%' }}> */}
            <Fieldset legend="Tools">
                <div className={styles.tools}>
                    {
                        tools.map((tool, index) => (
                            <Tool
                                key={`tool-${index}`}
                                {...tool}
                                onDelete={() => toolActions.deleteTool(index)}
                            />
                        ))
                    }
                </div>
                <AddTool actions={actions} state={state} />
            </Fieldset>
            {/* </div> */}
            {/* <div style={{ width: '50%' }}>

            </div> */}
        </div>
        // </div>
    );
};

export default ToolSettings;
