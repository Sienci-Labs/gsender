import React from 'react';
import classNames from 'classnames';
import Dropdown, { MenuItem } from 'app/components/Dropdown';
import ToggleSwitch from 'app/components/ToggleSwitch';
import i18n from 'app/lib/i18n';
import styles from './index.styl';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
} from '../../constants';


const GeneralSettings = ({ active, state, actions }) => {
    const { units, reverseWidgets, autoReconnect } = state;
    return (
        <div className={classNames(
            styles.hidden,
            styles.settingsContainer,
            { [styles.visible]: active }
        )}
        >
            <h3>
                General Settings
            </h3>
            <div className={styles.toolMain}>
                <div className={styles.toolListings}>
                    <h4>Preferred Units</h4>
                    <div className={styles.rowSpace}>
                        <Dropdown
                            style={{
                                width: '100%'
                            }}
                            btnSize="lg"
                        >
                            <Dropdown.Toggle
                                btnStyle="flat"
                                style={{
                                    textAlign: 'right',
                                    width: '100%'
                                }}
                            >
                                {units === IMPERIAL_UNITS && i18n._('Inches (G20)')}
                                {units === METRIC_UNITS && i18n._('Millimeters (G21)')}
                            </Dropdown.Toggle>
                            <Dropdown.Menu size="lg">
                                <MenuItem header>
                                    {i18n._('Units')}
                                </MenuItem>
                                <MenuItem
                                    active={units === IMPERIAL_UNITS}
                                    onSelect={() => {
                                        actions.general.setUnits(IMPERIAL_UNITS);
                                    }}
                                    size="lg"
                                >
                                    {i18n._('Inches (G20)')}
                                </MenuItem>
                                <MenuItem
                                    active={units === METRIC_UNITS}
                                    onSelect={() => {
                                        actions.general.setUnits(METRIC_UNITS);
                                    }}
                                >
                                    {i18n._('Millimeters (G21)')}
                                </MenuItem>
                            </Dropdown.Menu>
                        </Dropdown>
                        <small>Units to be displayed throughout the interface.</small>
                    </div>
                </div>
                <div className={styles.addToolForm}>
                    <h4>Reverse Workspace</h4>
                    <ToggleSwitch
                        checked={reverseWidgets}
                        onChange={() => actions.general.setReverseWidgets()}
                    />
                    <small>Functionality appears on the left if toggled on.</small>

                    <h4>Auto-Reconnect</h4>
                    <ToggleSwitch
                        checked={autoReconnect}
                        onChange={() => actions.general.setAutoReconnect()}
                    />
                    <small>Attempt to reconnect to the same device you last connected to on program start.</small>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
