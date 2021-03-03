/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import Space from 'app/components/Space';
import styles from './index.styl';

class SwitchInput extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        getUsersNewSettings: PropTypes.func,
        grabNewSwitchInputSettings: PropTypes.func,
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

    handleSingleToggleSettingsSwitches = (event) => {
        let value = event.target.checked;
        let name = event.target.name;
        if (value === true) {
            value = 1;
        }
        if (value === false) {
            value = 0;
        }
        this.props.disableSettingsButton();
        this.props.grabNewSwitchInputSettings(name, value);
    }


    render() {
        let title = this.props.title;
        let switchSettings = this.props.switchSettings.settings;

        //swaps 1 and 0s for true and false
        if (switchSettings[title] === '1') {
            switchSettings[title] = true;
        }
        if (switchSettings[title] === '0') {
            switchSettings[title] = false;
        }
        return (
            <div className={styles.switch}>
                <div className={styles.disable}>Disabled</div>
                <div className={styles.singleToggles}>
                    <div className={styles.onoffswitch}>

                        <input
                            type="checkbox"
                            name={title}
                            className={styles.onoffswitchcheckbox}
                            id={title}
                            tabIndex="0"
                            onClick={this.handleSingleToggleSettingsSwitches}
                            defaultChecked={switchSettings[title]}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor={title} />
                    </div>
                </div>
                <div className={styles.enable}>Enabled</div>
            </div>
        );
    }
}

export default SwitchInput;
