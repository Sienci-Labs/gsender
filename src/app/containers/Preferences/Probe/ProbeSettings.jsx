import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AddProbe from './AddProbe';
import Probe from './Probe';


const ProbeSettings = ({ active, state, actions }) => {
    const { probeProfiles, probeSettings } = state;
    const probeActions = actions.probe;
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >

            <div className={styles.toolMain}>
                <div className={styles.toolListings}>
                    <h4>Probing settings</h4>
                    <label htmlFor="retraction">Retraction Distance</label>
                    <div className="input-group">
                        <input
                            type="number"
                            className="form-control input-sm"
                            id="retraction"
                            value={probeSettings.retractionDistance}
                            onChange={probeActions.changeRetractionDistance}
                        />
                        <div className="input-group-addon">mm</div>
                    </div>
                    <label htmlFor="normalFeedrate">Probe Feedrate</label>
                    <div className="input-group">
                        <input
                            type="number"
                            className="form-control input-sm"
                            id="normalFeedrate"
                            value={probeSettings.normalFeedrate}
                            onChange={probeActions.changeNormalFeedrate}
                        />
                        <div className="input-group-addon">mm/min</div>
                    </div>
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
