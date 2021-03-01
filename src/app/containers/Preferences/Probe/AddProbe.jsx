import React from 'react';
import ToggleSwitch from '../../../components/ToggleSwitch';
import styles from '../index.styl';

import Input from '../Input';

const AddProbe = ({ state, actions }) => {
    const { probe } = state;
    const { functions } = probe;
    const probeActions = actions.probe;

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <span id="helpBlock" className="help-block">Supported probe axes for this specific touchplate</span>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                    <div className={styles.inputSpread}>
                        <label htmlFor="xProbe">XY Probe</label>
                        <ToggleSwitch
                            checked={functions.x && functions.y}
                            onChange={() => {
                                probeActions.handleToggleChange('x');
                                probeActions.handleToggleChange('y');
                            }}
                        />
                    </div>
                    {/* <div className={styles.inputSpread}>
                        <label htmlFor="zProbe">Z Probe</label>
                        <ToggleSwitch
                            checked={functions.z}
                            onChange={() => probeActions.handleToggleChange('z')}
                        />
                    </div> */}
                </div>
            </div>
            {
                (functions.x && functions.y) && (
                    <Input
                        label="XY Thickness"
                        units="mm"
                        value={probe.xyThickness}
                        onChange={probeActions.changeXYThickness}
                        additionalProps={{ type: 'number', id: 'xyThickness' }}
                    />
                )
            }
            {
                functions.z && (
                    <Input
                        label="Z Thickness"
                        units="mm"
                        value={probe.zThickness}
                        onChange={probeActions.changeZThickness}
                        additionalProps={{ type: 'number', id: 'zThickness' }}
                    />
                )
            }
        </div>
    );
};

export default AddProbe;
