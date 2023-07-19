import React from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import Button from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.styl';

const FirmwareConfig = ({ state = {}, actions }) => {
    const { rotary } = state;

    const handleResetToDefault = () => {
        Confirm({
            content: 'Are you sure you reset the firmware configuration for Rotary Mode?',
            title: 'Reset Firmware Configuration',
            onConfirm: actions.rotary.resetFirmwareToDefault
        });
    };

    return (
        <Fieldset legend="Firmware Configuration">
            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $101 in the firmware when toggling into rotary mode."
                    location="default"
                >
                    <Input
                        label="Y-axis Travel Resolution"
                        value={rotary.firmwareSettings.$101}
                        onChange={(e) => actions.rotary.updateFirmwareSetting('$101', e.target.value)}
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $111 in the firmware when toggling into rotary mode."
                    location="default"
                >
                    <Input
                        label="Y-axis Maximum Rate"
                        value={rotary.firmwareSettings.$111}
                        onChange={(e) => actions.rotary.updateFirmwareSetting('$111', e.target.value)}
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
                        checked={!!Number(rotary.firmwareSettings.$21)}
                        label="Hard Limits Enable ($21)"
                        size="small"
                    />
                </Tooltip>
            </div>

            <Button style={{ marginBottom: '1rem' }} onClick={handleResetToDefault}>Reset to Default</Button>
        </Fieldset>
    );
};

export default FirmwareConfig;
