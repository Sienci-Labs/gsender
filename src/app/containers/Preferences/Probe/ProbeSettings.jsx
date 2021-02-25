import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AddProbe from './AddProbe';


const ProbeSettings = ({ active, state, actions }) => {
    const { probeSettings, probe } = state;
    const probeActions = actions.probe;
    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles['settings-title']}>Probe</h3>
            <div className={styles.toolMain}>
                <div className={styles.toolListings}>
                    <h4 className={styles['settings-subtitle']}>Probing Settings</h4>

                    <div className={styles['probe-settings-group']}>
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
                    </div>

                    <div className={styles['probe-settings-group']}>
                        <label htmlFor="normalFeedrate">Normal Probe Feedrate</label>
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
                    </div>

                    <div className={styles['probe-settings-group']}>
                        <label htmlFor="normalFeedrate">Fast Probe Feedrate</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-control input-sm"
                                id="normalFeedrate"
                                value={probeSettings.fastFeedrate}
                                onChange={probeActions.changeFastFeedrate}
                            />
                            <div className="input-group-addon">mm/min</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h4 className={styles['settings-subtitle']}>Touch Plate Dimensions</h4>
                        <div className="form-group">
                            <label htmlFor="plateWidth">Touch Plate Width</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control"
                                    id="plateWidth"
                                    value={probe.plateWidth}
                                    onChange={probeActions.changePlateWidth}
                                />
                                <div className="input-group-addon">mm</div>
                            </div>
                            <label htmlFor="plateLength">Touch Plate Length</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control"
                                    id="plateLength"
                                    value={probe.plateLength}
                                    onChange={probeActions.changePlateLength}
                                />
                                <div className="input-group-addon">mm</div>
                            </div>
                            <span id="helpBlock" className="help-block">Width and length measurements of the touchplate, used for calculating tool diameters on the fly.</span>
                        </div>
                    </div>
                </div>
                <div className={styles.addToolForm}>
                    <h4 className={styles['settings-subtitle']}>Edit Touch Plate Profile</h4>
                    <AddProbe actions={actions} state={state} />
                </div>
            </div>
        </div>
    );
};

export default ProbeSettings;
