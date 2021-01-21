import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AddProbe from './AddProbe';


const ProbeSettings = ({ active, state, actions }) => {
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >
            <h3>
                Probe
            </h3>
            <div className={styles.toolMain}>
                <div className={styles.toolListings}>
                    <h4>Probe Settings</h4>
                    <h5>About (PROBE_NAME)</h5>
                </div>
                <div className={styles.addToolForm}>
                    <h4>Add Touch Plate Profile</h4>
                    <AddProbe actions={actions} state={state} />
                </div>
            </div>
        </div>
    );
};

export default ProbeSettings;
