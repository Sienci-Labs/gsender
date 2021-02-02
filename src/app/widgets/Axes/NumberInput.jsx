import React, { PureComponent } from 'react';
import styles from './numberInput.styl';

class NumberInput extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            min: props.min,
            max: props.max,
            disabled: props.disabled
        };
    }

    getStep(increment = false) {
        const { value } = this.props;
        let step;

        if (value === 0) {
            return 0.1;
        }
        if (value < 1) {
            step = 0.1;
        } else if (value < 10) {
            step = 1;
        } else if (value < 100) {
            step = 10;
        } else if (value < 1000) {
            step = 100;
        } else if (value < 10000) {
            step = 1000;
        }

        if (!increment && step !== 0.1 && value - step === 0) {
            step /= 10;
        }
        return step;
    }

    incrementValue(e) {
        e.preventDefault();
        const { changeHandler } = this.props;
        const { max } = this.state;
        const { value } = this.props;
        let newValue = Number(value) + Number(this.getStep(true));
        if (newValue > max) {
            newValue = max;
        }
        newValue = Number(newValue).toFixed(3);
        this.setState({
            value: newValue
        });
        changeHandler(newValue);
    }

    decrementValue(e) {
        e.preventDefault();
        const { changeHandler } = this.props;
        const { min } = this.state;
        const { value } = this.props;
        let newValue = value - this.getStep();
        if (newValue < min) {
            newValue = min;
        }
        newValue = Number(newValue).toFixed(3);
        this.setState({
            value: newValue
        });
        changeHandler(newValue);
    }

    setValue(e) {
        const { max, min } = this.state;
        const { changeHandler } = this.props;
        let value = Number(e.target.value);
        if (value > max) {
            value = max;
        } else if (value < min) {
            value = min;
        }

        changeHandler(value);
    }

    render() {
        const { value } = this.props;
        return (
            <div className={styles.inputWrapper}>
                <input
                    value={value}
                    type="text"
                    inputMode="decimal"
                    onChange={(e) => this.setValue(e)}
                />
                <div className={styles.controlWrapper}>
                    <button type="button" className={styles.stepButton} onClick={(e) => this.incrementValue(e)}>
                        <i className="fa fa-caret-up fa-fw" />
                    </button>
                    <button type="button" className={styles.stepButton} onClick={(e) => this.decrementValue(e)}>
                        <i className="fa fa-caret-down fa-fw" />
                    </button>
                </div>
            </div>

        );
    }
}

export default NumberInput;
