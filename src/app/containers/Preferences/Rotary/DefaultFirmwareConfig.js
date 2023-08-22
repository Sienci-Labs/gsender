import React from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Button from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import store from 'app/store';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.styl';
import { IMPERIAL_UNITS } from '../../../constants';

const DefaultFirmwareConfig = ({ state = {}, actions }) => {
    const { rotary } = state;

    const handleResetToDefault = () => {
        Confirm({
            content: 'Are you sure you reset the default firmware configuration?',
            title: 'Reset Default Firmware Configuration',
            onConfirm: actions.rotary.resetDefaultFirmwareSettings
        });
    };

    const processFirmwareValue = (value) => {
        const units = store.get('workspace.units');

        if (units === IMPERIAL_UNITS) {
            return Number((value / 25.4).toFixed(3));
        }

        return value;
    };

    const units = store.get('workspace.units');

    const $101 = processFirmwareValue(rotary.defaultFirmwareSettings.$101);
    const $111 = processFirmwareValue(rotary.defaultFirmwareSettings.$111);
    const $21 = !!Number(rotary.defaultFirmwareSettings.$21);

    return (
        <Fieldset legend="Default Firmware Configuration">
            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $101 in the firmware when exiting rotary mode."
                    location="default"
                >
                    <Input
                        label="Y-axis Travel Resolution"
                        value={$101}
                        onChange={(e) => actions.rotary.updateDefaultFirmwareSetting('$101', e.target.value)}
                        units={`step/${units}`}
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $111 in the firmware when exiting rotary mode."
                    location="default"
                >
                    <Input
                        label="Y-axis Maximum Rate"
                        value={$111}
                        onChange={(e) => actions.rotary.updateDefaultFirmwareSetting('$111', e.target.value)}
                        units={`${units}/min`}
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $21 in the firmware when exiting rotary mode."
                    location="default"
                >
                    <ToggleSwitch
                        onChange={(value) => actions.rotary.updateDefaultFirmwareSetting('$21', (+value).toString())}
                        checked={$21}
                        label="Hard Limits"
                        size="small"
                    />
                </Tooltip>
            </div>

            <Button style={{ marginBottom: '1rem' }} onClick={handleResetToDefault}>Reset to Default</Button>
        </Fieldset>
    );
};

export default DefaultFirmwareConfig;
