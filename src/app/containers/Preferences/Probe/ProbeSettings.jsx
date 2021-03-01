import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AddProbe from './AddProbe';

import Tools from '../Tools/Tools';

import Fieldset from '../FieldSet';
import Input from '../Input';


const ProbeSettings = ({ active, state, actions }) => {
    const { probeSettings, probe } = state;
    const { functions } = probe;
    const probeActions = actions.probe;
    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles['settings-title']}>Probe</h3>
            <div className={styles.generalArea}>
                <div style={{ width: '50%' }}>
                    <Fieldset legend="Probing Settings">

                        <Input
                            label="Fast Find"
                            value={probeSettings.fastFeedrate}
                            onChange={probeActions.changeFastFeedrate}
                            additionalProps={{ type: 'number', id: 'fastFeedrate' }}
                        />

                        <Input
                            label="Slow Find"
                            value={probeSettings.normalFeedrate}
                            onChange={probeActions.changeNormalFeedrate}
                            additionalProps={{ type: 'number', id: 'normalFeedrate' }}
                        />

                        <Input
                            label="Retraction"
                            value={probeSettings.retractionDistance}
                            onChange={probeActions.changeRetractionDistance}
                            additionalProps={{ type: 'number', id: 'retraction' }}
                        />
                    </Fieldset>

                    <Fieldset legend="Touch Plate" className={styles['mb-0']}>
                        <AddProbe actions={actions} state={state} />

                        {
                            (functions.x && functions.y) && (
                                <div>
                                    <Input
                                        label="Length"
                                        value={probe.plateLength}
                                        units="mm"
                                        onChange={probeActions.changePlateLength}
                                        additionalProps={{ type: 'number', id: 'plateLength' }}
                                    />

                                    <Input
                                        label="Width"
                                        value={probe.plateWidth}
                                        units="mm"
                                        onChange={probeActions.changePlateWidth}
                                        additionalProps={{ type: 'number', id: 'plateWidth' }}
                                    />
                                </div>
                            )
                        }

                    </Fieldset>

                </div>

                <div style={{ width: '50%' }}>
                    <Tools state={state} actions={actions} />
                </div>
            </div>
        </div>
    );
};

export default ProbeSettings;
