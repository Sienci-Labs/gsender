import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import i18n from 'app/lib/i18n';
// import Space from 'app/components/Space';
import styles from './index.styl';


class NumberInputs extends PureComponent {
    static propTypes = {
        title: PropTypes.string,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        currentSettings: PropTypes.object,
        getUsersNewSettings: PropTypes.func,
        grabNewNumberInputSettings: PropTypes.func,
        units: PropTypes.string,
        disableSettingsButton: PropTypes.func
    }

    state = this.getInitialState();

    getInitialState() {
        return {
            defaultSettings: '',
            usersNewSettings: {}
        };
    }


    componentDidMount = () => {
        this.getCurrentSettings();
    }

    getCurrentSettings = () => {
        let LoadedSettings = this.props.currentSettings;
        this.setState({ defaultSettings: LoadedSettings });
    }

    handleNumberInputs = (event) => {
        let value = event.target.value;
        let name = event.target.name;
        this.props.disableSettingsButton();
        this.setState(prevState => ({
            defaultSettings: {
                ...prevState.defaultSettings,
                [name]: value
            }
        }));
        this.props.grabNewNumberInputSettings(name, value);
    }

    render() {
        let title = this.props.title;
        let min = this.props.min;
        let max = this.props.max;
        let step = this.props.step;
        let units = this.props.units;
        let placeHolder = this.state.defaultSettings[title];
        return (
            <div className={styles.numberInputs}>
                <input
                    name={title}
                    type="number"
                    className={styles.formControlModal}
                    value={placeHolder || ''}
                    onChange={this.handleNumberInputs}
                    min={min}
                    max={max}
                    step={step}
                /><span className={styles.inputGroupAddon}>{i18n._(units)}</span>
            </div>
        );
    }
}

export default NumberInputs;
