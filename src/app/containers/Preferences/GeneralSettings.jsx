import React from 'react';
import classNames from 'classnames';
import Dropdown, { MenuItem } from 'app/components/Dropdown';
import i18n from 'app/lib/i18n';
import styles from './index.styl';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS,
} from '../../constants';


const GeneralSettings = ({ active, state, actions }) => {
    const { units } = state;
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
                            pullRight
                            style={{
                                width: '100%'
                            }}
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
                            <Dropdown.Menu>
                                <MenuItem header>
                                    {i18n._('Units')}
                                </MenuItem>
                                <MenuItem
                                    active={units === IMPERIAL_UNITS}
                                    onSelect={() => {
                                        actions.general.setUnits(IMPERIAL_UNITS);
                                    }}
                                >
                                    {i18n._('G20 (inch)')}
                                </MenuItem>
                                <MenuItem
                                    active={units === METRIC_UNITS}
                                    onSelect={() => {
                                        actions.general.setUnits(METRIC_UNITS);
                                    }}
                                >
                                    {i18n._('G21 (mm)')}
                                </MenuItem>
                            </Dropdown.Menu>
                        </Dropdown>
                        <small>Which units will be displayed throughout the interface.</small>
                    </div>
                </div>
                <div className={styles.addToolForm}>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
