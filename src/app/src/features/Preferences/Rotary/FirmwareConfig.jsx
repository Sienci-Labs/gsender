import React from 'react';

import { Tooltip } from 'app/components/Tooltip';
import ToggleSwitch from 'app/components/Switch';
import { Button } from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';

import styles from '../index.module.styl';

const FirmwareConfig = ({ state = {}, actions }) => {
    const { rotary } = state;

    const handleResetToDefault = () => {
        Confirm({
            content:
                'Are you sure you reset the firmware configuration for Rotary Mode?',
            title: 'Reset Firmware Configuration',
            onConfirm: actions.rotary.resetFirmwareToDefault,
        });
    };

    const $101 = rotary.firmwareSettings.$101;
    const $111 = rotary.firmwareSettings.$111;
    const $20 = !!Number(rotary.firmwareSettings.$20);
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
                        onChange={(e) =>
                            actions.rotary.updateFirmwareSetting(
                                '$101',
                                e.target.value,
                            )
                        }
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
                        onChange={(e) =>
                            actions.rotary.updateFirmwareSetting(
                                '$111',
                                e.target.value,
                            )
                        }
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
                        onChange={(value) =>
                            actions.rotary.updateFirmwareSetting(
                                '$21',
                                (+value).toString(),
                            )
                        }
                        checked={$21}
                        label="Force Hard Limits"
                        size="small"
                    />
                </Tooltip>
            </div>

            <div className={styles.addMargin}>
                <Tooltip
                    content="The value used here will be used to update $20 in the firmware when toggling into rotary mode."
                    location="default"
                >
                    <ToggleSwitch
                        onChange={(value) =>
                            actions.rotary.updateFirmwareSetting(
                                '$20',
                                (+value).toString(),
                            )
                        }
                        checked={$20}
                        label="Force Soft Limits"
                        size="small"
                    />
                </Tooltip>
            </div>

            <Button
                style={{ marginBottom: '1rem' }}
                onClick={handleResetToDefault}
            >
                Reset to Default
            </Button>
        </Fieldset>
    );
};

export default FirmwareConfig;
