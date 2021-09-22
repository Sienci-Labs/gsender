import React from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Fieldset from '../components/Fieldset';
import Baudrates from './Baudrates';

import styles from '../index.styl';

const Connection = ({ state, actions }) => {
    const { autoReconnect, controller } = state;
    let baudRateDisabled = true;
    if (controller.type === '') {
        baudRateDisabled = false;
    }
    return (
        <Fieldset legend="Connection">
            <Tooltip content="Machine must be disconnected to change this value" location="top" disabled={!baudRateDisabled}>
                <Tooltip content="Baudrate specifies how fast data is sent over a serial line." location="default">
                    <div className={baudRateDisabled ? styles.disabled : ''}>
                        <Baudrates baudrate={state.baudrate} onChange={(option) => actions.general.setBaudrate(option)} />
                        <br />
                    </div>
                </Tooltip>
            </Tooltip>
            <div className={styles.reconnect}>
                <Tooltip content="Reconnect to the last machine you used automatically" location="default">
                    <ToggleSwitch
                        label="Re-connect automatically"
                        checked={autoReconnect}
                        onChange={() => actions.general.setAutoReconnect()}
                        size="small"
                    />
                </Tooltip>
            </div>
        </Fieldset>
    );
};

export default Connection;
