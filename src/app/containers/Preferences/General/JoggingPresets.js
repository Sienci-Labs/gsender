/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { Component } from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import pubsub from 'pubsub-js';

import store from 'app/store';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import defaultState from 'app/store/defaultState';

import Fieldset from '../components/Fieldset';
import Input from '../components/Input';
import styles from '../index.styl';
import { convertToImperial, convertToMetric } from '../calculate';

export default class JoggingPresets extends Component {
    pubsubTokens = []

    state = {
        units: store.get('workspace.units'),
        jogSpeeds: this.getJogSpeeds(),
        selectedPreset: 'precise',
    }

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Settings Updated',
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

    componentDidMount() {
        const tokens = [
            pubsub.subscribe('units:change', (msg, units) => {
                this.updateState(units);
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    componentWillUnmount() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    getJogSpeeds() {
        const jog = store.get('widgets.axes.jog', {});
        const { rapid, normal, precise } = jog;

        return { rapid, normal, precise };
    }

    handleJogClick = (selected) => {
        this.setState({
            selectedPreset: selected
        });
    }

    updateState = (unit) => {
        const units = unit || store.get('workspace.units');

        const jogSpeeds = this.getJogSpeeds();
        // force update
        this.setState({
            units,
            jogSpeeds: {
                rapid: {
                    mm: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    },
                    in: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    }
                },
                normal: {
                    mm: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    },
                    in: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    }
                },
                precise: {
                    mm: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    },
                    in: {
                        xyStep: '',
                        zStep: '',
                        feedrate: ''
                    }
                }
            }
        }, () => {
            this.setState({
                jogSpeeds: { ...jogSpeeds }
            });
        });
    }

    handleXYChange = (e) => {
        // if empty input, do nothing
        if (e.target.value === '') {
            return;
        }

        let value = Number(e.target.value);
        const { units, selectedPreset, jogSpeeds } = this.state;

        const currentPreset = jogSpeeds[selectedPreset];

        const maxMM = 9000;
        const minMM = 0.01;
        const maxIN = 354;
        const minIN = 0.001;

        if (units === 'mm') {
            if (value >= maxMM) {
                value = maxMM;
            } else if (value <= minMM) {
                value = minMM;
            }
        }

        if (units === 'in') {
            if (value >= maxIN) {
                value = maxIN;
            } else if (value <= minIN) {
                value = minIN;
            }
        }

        const metricValue = units === 'mm' ? value : convertToMetric(value);
        const imperialValue = units === 'in' ? value : convertToImperial(value);

        const prev = store.get('widgets.axes');

        const updated = {
            ...prev,
            jog: {
                ...prev.jog,
                [selectedPreset]: {
                    ...currentPreset,
                    mm: {
                        ...currentPreset.mm,
                        xyStep: metricValue
                    },
                    in: {
                        ...currentPreset.in,
                        xyStep: imperialValue
                    }
                }
            }
        };

        store.replace('widgets.axes', updated);
        this.updateState();
        this.showToast();
    }

    handleZChange = (e) => {
        if (e.target.value === '') {
            return;
        }

        let value = Number(e.target.value);
        const { units, selectedPreset, jogSpeeds } = this.state;

        const currentPreset = jogSpeeds[selectedPreset];

        const maxMM = 9000;
        const minMM = 0.01;
        const maxIN = 354;
        const minIN = 0.001;

        if (units === 'mm') {
            if (value >= maxMM) {
                value = maxMM;
            } else if (value <= minMM) {
                value = minMM;
            }
        }

        if (units === 'in') {
            if (value >= maxIN) {
                value = maxIN;
            } else if (value <= minIN) {
                value = minIN;
            }
        }

        const metricValue = units === 'mm' ? value : convertToMetric(value);
        const imperialValue = units === 'in' ? value : convertToImperial(value);

        const prev = store.get('widgets.axes');

        const updated = {
            ...prev,
            jog: {
                ...prev.jog,
                [selectedPreset]: {
                    ...currentPreset,
                    mm: {
                        ...currentPreset.mm,
                        zStep: metricValue
                    },
                    in: {
                        ...currentPreset.in,
                        zStep: imperialValue
                    },
                }
            }
        };

        store.replace('widgets.axes', updated);
        this.updateState();
        this.showToast();
    }

    handleSpeedChange = (e) => {
        if (e.target.value === '') {
            return;
        }

        let value = Number(e.target.value);
        const { units, selectedPreset, jogSpeeds } = this.state;
        const currentPreset = jogSpeeds[selectedPreset];

        const maxMM = 90000;
        const minMM = 50;
        const maxIN = 3543;
        const minIN = 2;

        if (units === 'mm') {
            if (value >= maxMM) {
                value = maxMM;
            } else if (value <= minMM) {
                value = minMM;
            }
        }

        if (units === 'in') {
            if (value >= maxIN) {
                value = maxIN;
            } else if (value <= minIN) {
                value = minIN;
            }
        }

        const metricValue = units === 'mm' ? value : convertToMetric(value);
        const imperialValue = units === 'in' ? value : convertToImperial(value);

        const prev = store.get('widgets.axes');

        const updated = {
            ...prev,
            jog: {
                ...prev.jog,
                [selectedPreset]: {
                    ...currentPreset,
                    mm: {
                        ...currentPreset.mm,
                        feedrate: metricValue,
                    },
                    in: {
                        ...currentPreset.in,
                        feedrate: imperialValue,
                    },
                }
            }
        };

        store.replace('widgets.axes', updated);
        this.updateState();
        this.showToast();
    }

    confirmResetToDefault = () => {
        Confirm({
            title: 'Reset Jogging Presets to Default',
            content: 'This will reset precise, normal, and rapid preset values to default. Are you sure you want to reset?',
            onConfirm: this.resetToDefault,
        });
    }

    resetToDefault = () => {
        const defaultJogPresets = _.get(defaultState, 'widgets.axes.jog', null);

        if (!defaultJogPresets) {
            return;
        }

        store.replace('widgets.axes.jog', defaultJogPresets);
        this.setState({ jogSpeeds: this.getJogSpeeds() });
        pubsub.publish('jogSpeeds', defaultJogPresets);

        this.showToast();
    }

    render() {
        const { units, jogSpeeds, selectedPreset } = this.state;

        const preset = jogSpeeds[selectedPreset];

        const xyValue = preset[units]?.xyStep;
        const zValue = preset[units]?.zStep;
        const speedValue = preset[units]?.feedrate;

        return (
            <Fieldset legend="Jogging Presets">
                <div className={classnames(styles.jogSpeedWrapper, styles.flexRow)}>
                    <button type="button" onClick={() => this.handleJogClick('precise')} className={styles[selectedPreset === 'precise' ? 'jog-speed-active' : 'jog-speed-inactive']}>Precise</button>
                    <button type="button" onClick={() => this.handleJogClick('normal')} className={styles[selectedPreset === 'normal' ? 'jog-speed-active' : 'jog-speed-inactive']}>Normal</button>
                    <button type="button" onClick={() => this.handleJogClick('rapid')} className={styles[selectedPreset === 'rapid' ? 'jog-speed-active' : 'jog-speed-inactive']}>Rapid</button>
                </div>
                <div className={styles['jog-spead-wrapper']}>
                    <Tooltip content="Set amount of movement for XY Jog Speed Preset Buttons" location="default">
                        <Input
                            label="XY Move"
                            units={units}
                            onChange={this.handleXYChange}
                            additionalProps={{ type: 'number', id: 'xyStep' }}
                            value={xyValue}
                        />
                    </Tooltip>
                    <Tooltip content="Set amount of movement for Z Jog Speed Preset Buttons" location="default">
                        <Input
                            label="Z Move"
                            units={units}
                            onChange={this.handleZChange}
                            additionalProps={{ type: 'number', id: 'zStep' }}
                            value={zValue}
                        />
                    </Tooltip>
                    <Tooltip content="Set the speed for the Jog Speed Preset Buttons" location="default">
                        <Input
                            label="Speed"
                            units={`${units}/min`}
                            onChange={this.handleSpeedChange}
                            additionalProps={{ type: 'number', id: 'feedrate' }}
                            value={speedValue}
                        />
                    </Tooltip>
                </div>

                <Button style={{ marginBottom: '1rem' }} onClick={this.confirmResetToDefault}>Reset to Default</Button>
            </Fieldset>
        );
    }
}
