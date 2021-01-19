import React from 'react';
import classNames from 'classnames';
import styles from './index.styl';


const ToolSettings = ({ active, state, actions }) => {
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
        </div>
    );
};

export default ToolSettings;
