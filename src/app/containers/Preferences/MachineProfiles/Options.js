import React, { Component } from 'react';
import Select from 'react-select';
import pubsub from 'pubsub-js';
import _isEqual from 'lodash/isEqual';
import ensureArray from 'ensure-array';

import ToggleSwitch from 'app/components/ToggleSwitch';
import store from 'app/store';

import styles from '../index.styl';
import defaultProfiles from './defaultMachineProfiles';


/**
 * Machine Profile Options Component
 */
export default class Options extends Component {
    state = {
        machineProfiles: defaultProfiles.sort((a, b) => a.company.localeCompare(b.company)),
        machineProfile: store.get('workspace.machineProfile')
    };

    pubsubTokens = [];

    /**
     * Function to handle preset machine profile select
     * @param {Object} options {value} The ID of the profile which is the selected option's value
     */
    handleSelect = ({ value = 0 }) => {
        const { machineProfiles } = this.state;

        const foundProfile = machineProfiles.find(profile => profile.id === value);

        if (foundProfile) {
            store.replace('workspace.machineProfile', {
                ...foundProfile,
                limits: {
                    xmin: 0,
                    ymin: 0,
                    zmin: 0,
                    xmax: foundProfile.width,
                    ymax: foundProfile.height,
                    zmax: foundProfile.depth,
                }
            });
        }
    }

    /**
     * Function to handle width, depth, and height input changes
     * @param {Object} e Changed element
     */
    handleChange = (e) => {
        const name = e.target.name;
        const value = Number(Number(e.target.value).toFixed(2)); //.toFixed returns a string, hence the extra Number wrapper

        const { machineProfile } = this.state;

        const MAX_VALUE = 5000;
        const MIN_VALUE = 0;

        //Object to map work area dimmensions to limits
        const limitMap = {
            width: 'xmax',
            height: 'ymax',
            depth: 'zmax'
        }[name];

        // Limit the given value
        if (value > MAX_VALUE || value < MIN_VALUE) {
            return;
        }

        store.replace('workspace.machineProfile', {
            ...machineProfile,
            [name]: value,
            limits: {
                ...machineProfile.limits,
                [limitMap]: value
            }
        });
    }

    /**
     * Function to handle trigger changes to attributes within the current machine profile
     * @param {Object} e Changed element
     */
    handleToggle = (id) => {
        const { machineProfile } = this.state;

        store.replace('workspace.machineProfile', {
            ...machineProfile,
            [id]: !machineProfile[id],
        });
    }

    updateMachineProfileFromStore = () => {
        const machineProfile = store.get('workspace.machineProfile');
        if (!machineProfile || _isEqual(machineProfile, this.state.machineProfile)) {
            return;
        }

        this.setState({ machineProfile });
    };

    updateMachineProfilesFromSubscriber = (machineProfiles) => {
        this.setState({
            machineProfiles: ensureArray(machineProfiles)
        });
    };

    subscribe() {
        const tokens = [
            pubsub.subscribe('updateMachineProfiles', (msg, machineProfiles) => {
                this.updateMachineProfilesFromSubscriber(machineProfiles);
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    componentDidMount() {
        store.on('change', this.updateMachineProfileFromStore);
        this.subscribe();
    }

    componentWillUnmount() {
        store.removeListener('change', this.updateMachineProfileFromStore);
        this.unsubscribe();
    }

    render() {
        const { machineProfile, machineProfiles } = this.state;
        const { id, endstops, laser, spindle, coolant, width, depth, height, units } = machineProfile;

        return (
            <div>
                <div className={styles['machine-options-section']}>
                    <div className={styles['general-area-item']}>
                        <h4 className={styles['settings-subtitle']}>Presets</h4>

                        <Select
                            className={styles['machine-options-select']}
                            value={id}
                            options={machineProfiles.map(({ id, name, company, type }) => ({ key: id, value: id, label: `${company} ${name} ${' - ' && type}` }))}
                            onChange={this.handleSelect}
                            clearable={false}
                        />
                    </div>

                    <div className={styles['general-area-item']}>
                        <h4 className={styles['settings-subtitle']}>Cutting Area</h4>

                        <table className={styles['cutting-area']}>
                            <tbody>
                                <tr>
                                    <td className={styles.label}>Width</td>
                                    <td className={styles.value}>
                                        <div className="input-group" style={{ width: '200px' }}>
                                            <input
                                                type="text"
                                                name="width"
                                                className="form-control"
                                                style={{ zIndex: '0', fontSize: '20px', textAlign: 'center', color: '#3e85c7' }}
                                                value={width}
                                                onChange={this.handleChange}
                                            />
                                            <span className="input-group-addon">{units}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Depth</td>
                                    <td className={styles.value}>
                                        <div className="input-group" style={{ width: '200px' }}>
                                            <input
                                                type="text"
                                                name="depth"
                                                className="form-control"
                                                style={{ zIndex: '0', fontSize: '20px', textAlign: 'center', color: '#3e85c7' }}
                                                value={depth}
                                                onChange={this.handleChange}
                                            />
                                            <span className="input-group-addon">{units}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Height</td>
                                    <td className={styles.value}>
                                        <div className="input-group" style={{ width: '200px' }}>
                                            <input
                                                type="text"
                                                name="height"
                                                className="form-control"
                                                style={{ zIndex: '0', fontSize: '20px', textAlign: 'center', color: '#3e85c7' }}
                                                value={height}
                                                onChange={this.handleChange}
                                            />
                                            <span className="input-group-addon">{units}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles['general-area-item']}>
                    <h4 className={styles['settings-subtitle']}>Machine Features</h4>
                    <div className={styles['machine-features-section']}>
                        <div className={styles['machine-options-inputgroup']}>
                            <label htmlFor="">Endstops</label>
                            <ToggleSwitch
                                checked={endstops}
                                onChange={() => this.handleToggle('endstops')}
                            />
                        </div>

                        <div className={styles['machine-options-inputgroup']}>
                            <label htmlFor="">Spindle</label>
                            <ToggleSwitch
                                checked={spindle}
                                onChange={() => this.handleToggle('spindle')}
                            />
                        </div>
                    </div>

                    <div className={styles['machine-features-section']}>
                        <div className={styles['machine-options-inputgroup']} style={{ margin: 0 }}>
                            <label htmlFor="">Coolant</label>
                            <ToggleSwitch
                                checked={coolant}
                                onChange={() => this.handleToggle('coolant')}
                            />
                        </div>

                        <div className={styles['machine-options-inputgroup']} style={{ margin: 0 }}>
                            <label htmlFor="">Laser</label>
                            <ToggleSwitch
                                checked={laser}
                                onChange={() => this.handleToggle('laser')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
