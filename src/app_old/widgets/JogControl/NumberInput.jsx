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

import React, { PureComponent } from 'react';
import ControlledNumberInput from 'app/components/ControlledNumberInput';
import styles from './numberInput.styl';

class NumberInput extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            min: props.min,
            max: props.max,
            disabled: props.disabled,
            decimals: props.decimals
        };
    }

    getStep(increment = false) {
        const { value } = this.props;
        let step;

        if (value === 0) {
            return 0.1;
        }
        if (value < 0.1) {
            step = 0.01;
        } else if (value < 1) {
            step = 0.1;
        } else if (value < 10) {
            step = 1;
        } else if (value < 100) {
            step = 10;
        } else if (value < 1000) {
            step = 100;
        } else if (value < 10000) {
            step = 1000;
        } else {
            step = 10000;
        }

        if (!increment && step !== 0.001 && value - step === 0) {
            step /= 10;
        }
        return step;
    }

    incrementValue(e) {
        e.preventDefault();
        const { changeHandler } = this.props;
        const { max, decimals } = this.state;
        const { value } = this.props;
        let newValue = Number(value) + Number(this.getStep(true));
        if (newValue > max) {
            newValue = max;
        }
        newValue = Number(newValue).toFixed(decimals);
        this.setState({
            value: newValue
        });
        changeHandler(newValue);
    }

    decrementValue(e) {
        e.preventDefault();
        const { changeHandler } = this.props;
        const { min, decimals } = this.state;
        const { value } = this.props;
        let newValue = value - this.getStep();
        if (newValue < min) {
            newValue = min;
        }
        newValue = Number(newValue).toFixed(decimals);
        this.setState({
            value: newValue
        });
        changeHandler(newValue);
    }

    setValue(e) {
        const { max, min } = this.state;
        const { changeHandler } = this.props;
        let value = e.target.value;

        // Ignore non digit and non . values
        // eslint-disable-next-line no-restricted-globals
        if (!this.checkForInvalidInput(value)) {
            if (Number(value) >= max) {
                value = max;
            } else if (Number(value) <= min) {
                value = min;
            }

            /*
                force update for cases when value is the "same"
                ex. user inputs 9000.01. this is over the max, so the value is set to 9000.
                    if they do it again, the value will still be set as 9000, meaning the display will not update,
                    and "9000.01" will still be displayed.
                    therefore, we force update the display.
            */
            value = Number(value);
            changeHandler(value);
            if (this.state.value === value) {
                this.setState({
                    value: '',
                }, () => {
                    this.setState({
                        value: value,
                    });
                });
            } else {
                this.setState({
                    value: value,
                });
            }
        }
    }

    // returns true when invalid
    checkForInvalidInput(value) {
        const regex = /[^0-9.]/g;
        let dotOccurance = 0;
        [...value].forEach(char => char === '.' && dotOccurance++);
        if (regex.test(value) || dotOccurance > 1) {
            return true;
        }
        return false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateState();
    }

    updateState() {
        this.setState({
            value: this.props.value,
            min: this.props.min,
            max: this.props.max,
            disabled: this.props.disabled,
            decimals: this.props.decimals
        });
    }

    render() {
        const value = this.state.value;
        return (
            <div className={styles.inputWrapper}>
                <button type="button" className={styles.stepButton} onClick={(e) => this.decrementValue(e)}>
                    <i className="fa fa-minus fa-fw" style={{ verticalAlign: 'super', margin: 'auto', fontSize: 'clamp(10px, 1vw, 14px)' }} />
                </button>
                <ControlledNumberInput
                    value={value}
                    type="text"
                    inputMode="decimal"
                    externalOnChange={(e) => {
                        // if it's a blank value, don't update
                        if (e.target.value !== '') {
                            this.setValue(e);
                        }
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                />
                <button type="button" className={styles.stepButton} onClick={(e) => this.incrementValue(e)}>
                    <i className="fa fa-plus fa-fw" style={{ verticalAlign: 'super', margin: 'auto 0.5rem', fontSize: 'clamp(10px, 1vw, 14px)' }} />
                </button>
            </div>

        );
    }
}

export default NumberInput;
