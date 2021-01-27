import React from 'react';
import ToggleSwitch from '../../../components/ToggleSwitch';
import styles from '../index.styl';

const AddProbe = ({ state, actions }) => {
    const { probe } = state;
    const { functions } = probe;
    const probeActions = actions.probe;

    return (
        <div>
            <div className="form-group">
                <label htmlFor="xyThickness">Touch Plate Identifier</label>
                <input
                    type="text"
                    className="form-control"
                    id="id"
                    placeholder={probe.id}
                    value={probe.id}
                    onChange={(e) => probeActions.changeId(e)}
                />
                <span id="helpBlock" className="help-block">What you want to call this profile</span>
            </div>
            <div className="form-group">
                <label htmlFor="zThickness">Probe Functions</label>
                <span id="helpBlock" className="help-block">Supported probe axes for this specific touchplate.</span>
                <div className={styles.inputSpread}>
                    <label htmlFor="xProbe">X Probe</label>
                    <ToggleSwitch
                        checked={functions.x}
                        variantColor="green"
                        onChange={() => probeActions.handleToggleChange('x')}
                    />
                </div>
                <div className={styles.inputSpread}>
                    <label htmlFor="yProbe">Y Probe</label>
                    <ToggleSwitch
                        checked={functions.y}
                        variantColor="green"
                        onChange={() => probeActions.handleToggleChange('y')}
                    />
                </div>
                <div className={styles.inputSpread}>
                    <label htmlFor="zProbe">Z Probe</label>
                    <ToggleSwitch
                        checked={functions.z}
                        variantColor="green"
                        onChange={() => probeActions.handleToggleChange('z')}
                    />
                </div>
            </div>
            {
                (functions.x || functions.y) && (
                    <div className="form-group">
                        <label htmlFor="xyThickness">XY Thickness</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-control"
                                id="xyThickness"
                                value={probe.xyThickness}
                                onChange={probeActions.changeXYThickness}
                            />
                            <div className="input-group-addon">mm</div>
                        </div>
                        <span id="helpBlock" className="help-block">Distance between the side of the touchplate and the material it is resting on.</span>
                    </div>
                )
            }
            {
                functions.z && (
                    <div className="form-group">
                        <label htmlFor="zThickness">Z Thickness</label>
                        <div className="input-group">
                            <input
                                type="number"
                                className="form-control"
                                id="zThickness"
                                value={probe.zThickness}
                                onChange={probeActions.changeZThickness}
                            />
                            <div className="input-group-addon">mm</div>
                        </div>
                        <span id="helpBlock" className="help-block">Distance between the top of the touchplate and the material it is resting on. </span>
                    </div>
                )
            }
            <button className={styles.addTool} type="button" onClick={probeActions.addProbeProfile} disabled={!functions.x && !functions.y && !functions.z}>
                Add Probe Profile
            </button>
        </div>
    );
};

export default AddProbe;
