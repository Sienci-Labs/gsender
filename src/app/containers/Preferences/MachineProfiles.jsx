import React from 'react';
import classNames from 'classnames';
import styles from './index.styl';

import Options from './MachineProfiles/Options';


const MachineProfiles = ({ active, state, actions }) => {
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >
            <h3>
                Machine Profiles
            </h3>

            <Options />
        </div>
    );
};

export default MachineProfiles;
