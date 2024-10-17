import React from 'react';

import Tooltip from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';
import Fieldset from '../components/Fieldset';
import Baudrates from './Baudrates';
import cn from 'classnames';
import styles from '../index.module.styl';
import Input from '../components/Input';

const Connection = ({ state, actions }) => {
    const { autoReconnect, controller, ipRange } = state;
    let baudRateDisabled = true;
    if (controller.type === '') {
        baudRateDisabled = false;
    }
    return (
        <Fieldset legend="Connection">
            <Tooltip
                content="Machine must be disconnected to change this value"
                location="top"
                disabled={!baudRateDisabled}
            >
                <Tooltip
                    content="Baudrate specifies how fast data is sent over a serial line."
                    location="default"
                >
                    <div className={baudRateDisabled ? styles.disabled : ''}>
                        <Baudrates
                            baudrate={state.baudrate}
                            onChange={(option) =>
                                actions.general.setBaudrate(option)
                            }
                        />
                        <br />
                    </div>
                </Tooltip>
            </Tooltip>
            <div className={styles.reconnect}>
                <Tooltip
                    content="Reconnect to the last machine you used automatically"
                    location="default"
                >
                    <ToggleSwitch
                        label="Reconnect Automatically"
                        checked={autoReconnect}
                        onChange={() => actions.general.setAutoReconnect()}
                        size="small"
                    />
                </Tooltip>
            </div>
            <Tooltip
                content="Set the IP address for network scanning"
                location="default"
            >
                <h4 className={styles.settingsSubtitle}>IP Range</h4>
                <div className={styles.ipContainer}>
                    {ipRange.map((value, index) => {
                        return (
                            <React.Fragment key={value}>
                                <Input
                                    value={value}
                                    onChange={(e) =>
                                        actions.general.setIPRange(
                                            Number(e.target.value),
                                            index,
                                        )
                                    }
                                    additionalProps={{
                                        name: 'ip' + index,
                                        type: 'number',
                                        min: 0,
                                        max: 255,
                                    }}
                                    className={styles.ipInput}
                                    hasRounding={false}
                                />
                                {index !== 3 && (
                                    <strong className={styles.dot}>.</strong>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </Tooltip>
        </Fieldset>
    );
};

export default Connection;
