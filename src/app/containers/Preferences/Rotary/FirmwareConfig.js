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

const FirmwareConfig = ({ state = {}, actions }) => {
    const { rotary } = state;

    const handleResetToDefault = () => {
        Confirm({
            content: 'Are you sure you reset the firmware configuration for Rotary Mode?',
            title: 'Reset Firmware Configuration',
            onConfirm: actions.rotary.resetFirmwareToDefault
        });
    };

    const processFirmwareValue = (value) => {
        const units = store.get('workspace.units');

        if (units === IMPERIAL_UNITS) {
            return Number((value / 25.4).toFixed(3));
        }

        return value;
    };

    const $101 = processFirmwareValue(rotary.firmwareSettings.$101);
    const $111 = processFirmwareValue(rotary.firmwareSettings.$111);
    const $21 = !!Number(rotary.firmwareSettings.$21);

    return (
        <Fieldset legend="Rotary Firmware Configuration">
            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $101 in the firmware when enabling rotary mode."
                    location="default"
                >
                    <Input
                        label="A-axis Travel Resolution"
                        value={$101}
                        onChange={(e) => actions.rotary.updateFirmwareSetting('$101', e.target.value)}
                        units="step/deg"
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $111 in the firmware when enabling rotary mode."
                    location="default"
                >
                    <Input
                        label="A-axis Maximum Rate"
                        value={$111}
                        onChange={(e) => actions.rotary.updateFirmwareSetting('$111', e.target.value)}
                        units="deg/min"
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $21 in the firmware when toggling into rotary mode."
                    location="default"
                >
                    <ToggleSwitch
                        onChange={(value) => actions.rotary.updateFirmwareSetting('$21', (+value).toString())}
                        checked={$21}
                        label="Force Hard Limits"
                        size="small"
                    />
                </Tooltip>
            </div>

            <Button style={{ marginBottom: '1rem' }} onClick={handleResetToDefault}>Reset to Default</Button>
        </Fieldset>
    );
};

export default FirmwareConfig;
