import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AddProbe from './AddProbe';
import Probe from './Probe';


const ProbeSettings = ({ active, state, actions }) => {
    const { probeProfiles } = state;
    const probeActions = actions.probe;
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
                    <h4>Available Touchplates</h4>
                    <div className={styles.tools}>
                        {
                            probeProfiles.map((probe, index) => (
                                <Probe
                                    key={`tool-${index}`}
                                    {...probe}
                                    handleDelete={() => probeActions.deleteProbe(index)}
                                />
                            ))
                        }
                    </div>
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
