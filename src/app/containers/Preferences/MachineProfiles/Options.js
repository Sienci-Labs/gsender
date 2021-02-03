import React, { Component } from 'react';
import Select from 'react-select';
import pubsub from 'pubsub-js';
import _isEqual from 'lodash/isEqual';
import ensureArray from 'ensure-array';

import { Input } from 'app/components/FormControl';
import store from 'app/store';

import styles from './options.styl';
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
     * Function to handle checkbox changes
     * @param {Object} e Changed element
     */
    handleCheck = (e) => {
        const { name, checked } = e.target;

        const { machineProfile } = this.state;

        store.replace('workspace.machineProfile', {
            ...machineProfile,
            [name]: checked,
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
                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Presets</label>

                    <Select
                        className={styles['options-select']}
                        value={id}
                        options={machineProfiles.map(({ id, name, company, type }) => ({ key: id, value: id, label: `${company} ${name} ${' - ' && type}` }))}
                        onChange={this.handleSelect}
                        clearable={false}
                    />
                </div>

                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Cutting Area</label>

                    <table className={styles['cutting-area']}>
                        <tbody>
                            <tr>
                                <td className={styles.label}>Width</td>
                                <td className={styles.value}>
                                    <div className="input-group" style={{ width: '156px' }}>
                                        <input
                                            type="text"
                                            name="width"
                                            className="form-control"
                                            style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center' }}
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
                                    <div className="input-group" style={{ width: '156px' }}>
                                        <input
                                            type="text"
                                            name="depth"
                                            className="form-control"
                                            style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center' }}
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
                                    <div className="input-group" style={{ width: '156px' }}>
                                        <input
                                            type="text"
                                            name="height"
                                            className="form-control"
                                            style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center' }}
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

                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Endstops</label>
                    <Input
                        type="checkbox"
                        name="endstops"
                        checked={endstops}
                        onChange={this.handleCheck}
                    />
                </div>

                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Spindle</label>
                    <Input
                        type="checkbox"
                        name="spindle"
                        checked={spindle}
                        onChange={this.handleCheck}
                    />
                </div>

                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Coolant</label>
                    <Input
                        type="checkbox"
                        name="coolant"
                        checked={coolant}
                        onChange={this.handleCheck}
                    />
                </div>

                <div className={styles['options-inputgroup']}>
                    <label htmlFor="">Laser</label>
                    <Input
                        type="checkbox"
                        name="laser"
                        checked={laser}
                        onChange={this.handleCheck}
                    />
                </div>
            </div>
        );
    }
}
