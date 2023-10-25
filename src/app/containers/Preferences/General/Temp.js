import React from 'react';

import store from 'app/store';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.styl';

const TempSettings = ({ state, actions }) => {
    const incrementalAmount = store.get('workspace.temp.gamepad.joggingAmount', 0);
    const listenerInterval = store.get('workspace.temp.gamepad.listenerInterval', 0);

    return (
        <Fieldset legend="Temp Settings (Joystick Jogging)">
            <div className={styles.addMargin}>
                <Input
                    label="Jogging Amount"
                    value={incrementalAmount}
                    onChange={(e) => store.replace('workspace.temp.gamepad.joggingAmount', Number(e.target.value))}
                    additionalProps={{
                        type: 'number',
                        min: '0',
                    }}
                />
            </div>
            <div className={styles.addMargin}>
                <Input
                    label="Listener Interval"
                    value={listenerInterval}
                    onChange={(e) => store.replace('workspace.temp.gamepad.listenerInterval', Number(e.target.value))}
                    additionalProps={{
                        type: 'number',
                        min: '0',
                    }}
                />
            </div>
        </Fieldset>
    );
};

export default TempSettings;
