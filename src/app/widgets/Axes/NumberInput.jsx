import React, { PureComponent } from 'react';
import styles from './numberInput.styl';

class NumberInput extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
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

        const regex = /[^0-9.]/g;

        let dotOccurance = 0;
        [...value].forEach(char => char === '.' && dotOccurance++);
        // Ignore non digit and non . values
        // eslint-disable-next-line no-restricted-globals
        if (regex.test(value) || dotOccurance > 1) {
            return;
        }

        if (Number(value) > max) {
            value = max;
        } else if (Number(value) < min) {
            value = min;
        }

        changeHandler(value);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.setState({
            min: this.props.min,
            max: this.props.max,
            disabled: this.props.disabled,
            decimals: this.props.decimals
        });
    }

    render() {
        const { value } = this.props;
        return (
            <div className={styles.inputWrapper}>
                <button type="button" className={styles.stepButton} onClick={(e) => this.decrementValue(e)}>
                    <i className="fa fa-minus fa-fw" style={{ verticalAlign: 'super', margin: 'auto 0.5rem', fontSize: 'clamp(10px, 1vw, 14px)' }} />
                </button>
                <input
                    value={value}
                    type="text"
                    inputMode="decimal"
                    onChange={(e) => this.setValue(e)}
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
