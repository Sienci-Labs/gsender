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

import JogSpeeds from './General/JogSpeeds';
import MachineProfileOptions from './MachineProfiles/Options';

import Fieldset from './FieldSet';

const GeneralSettings = ({ active, state, actions }) => {
    const { units, reverseWidgets } = state;
    return (
        <div className={classNames(
            styles.hidden,
            styles['settings-wrapper'],
            { [styles.visible]: active }
        )}
        >
            <h3 className={styles.settingsTitle}>
                General Settings
            </h3>
            <div className={styles.toolMain}>
                <div className={styles.generalArea}>
                    <div style={{ width: '50% ' }}>
                        <Fieldset legend="Preferred Units">
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
                            <small>Units to be displayed throughout the interface</small>
                        </Fieldset>

                        <Fieldset legend="Machine Profile">
                            <MachineProfileOptions />
                        </Fieldset>
                    </div>

                    <div style={{ width: '50% ' }}>
                        <Fieldset legend="Jog Speed Presets">
                            {/* <h4 className={styles['settings-subtitle']}>Jog Speeds Presets</h4> */}
                            <JogSpeeds />
                        </Fieldset>
                    </div>
                </div>
                <div className={styles.addToolForm}>
                    <h4>Reverse Workspace</h4>
                    <ToggleSwitch
                        checked={reverseWidgets}
                        onChange={() => actions.general.setReverseWidgets()}
                    />
                    <small>Functionality appears on the left if toggled on.</small>
                </div>
            </div>

        </div>
    );
};

export default GeneralSettings;
