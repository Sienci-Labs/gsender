import React, { Component } from 'react';
import Select from 'react-select';
import pubsub from 'pubsub-js';
import _isEqual from 'lodash/isEqual';
import ensureArray from 'ensure-array';
import controller from 'app/lib/controller';
import ToggleSwitch from 'app/components/ToggleSwitch';
import store from 'app/store';

import styles from '../index.styl';
import defaultProfiles from './defaultMachineProfiles';

import Input from '../Input';


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
            const updatedObj = {
                ...foundProfile,
                limits: {
                    xmin: 0,
                    ymin: 0,
                    zmin: 0,
                    xmax: foundProfile.width,
                    ymax: foundProfile.depth,
                    zmax: foundProfile.height,
                }
            };
            store.replace('workspace.machineProfile', updatedObj);
            controller.command('machineprofile:load', updatedObj);
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
            height: 'zmax',
            depth: 'ymax'
        }[name];

        // Limit the given value
        if (value > MAX_VALUE || value < MIN_VALUE) {
            return;
        }

        const updatedObj = {
            ...machineProfile,
            [name]: value,
            limits: {
                ...machineProfile.limits,
                [limitMap]: value
            }
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);
    }

    /**
     * Function to handle trigger changes to attributes within the current machine profile
     * @param {Object} e Changed element
     */
    handleToggle = (id) => {
        const { machineProfile } = this.state;

        const updatedObj = {
            ...machineProfile,
            [id]: !machineProfile[id]
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);
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
        // const { id, endstops, laser, spindle, coolant, width, depth, height, units } = machineProfile;
        const { id, endstops, spindle, coolant, width, depth, height, units } = machineProfile;

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

                        <Input
                            label="Width"
                            units={units}
                            value={width}
                            onChange={this.handleChange}
                            additionalProps={{ name: 'width', type: 'number' }}
                        />

                        <Input
                            label="Depth"
                            units={units}
                            value={depth}
                            onChange={this.handleChange}
                            additionalProps={{ name: 'depth', type: 'number' }}
                        />

                        <Input
                            label="Height"
                            units={units}
                            value={height}
                            onChange={this.handleChange}
                            additionalProps={{ name: 'height', type: 'number' }}
                        />
                    </div>
                </div>

                <div className={styles['general-area-item']}>
                    <h4 className={styles['settings-subtitle']}>Machine Features</h4>
                    <div className={styles['machine-features-section']}>
                        <div className={styles['machine-options-inputgroup']}>
                            <ToggleSwitch
                                checked={endstops}
                                onChange={() => this.handleToggle('endstops')}
                            />
                            <label htmlFor="">Endstops</label>
                        </div>

                        <div className={styles['machine-options-inputgroup']}>
                            <ToggleSwitch
                                checked={spindle}
                                onChange={() => this.handleToggle('spindle')}
                            />
                            <label htmlFor="">Spindle</label>
                        </div>
                    </div>

                    <div className={styles['machine-features-section']}>
                        <div className={styles['machine-options-inputgroup']} style={{ display: 'grid', gridTemplateColumns: '1fr 5fr', margin: '0' }}>
                            <ToggleSwitch
                                checked={coolant}
                                onChange={() => this.handleToggle('coolant')}
                            />
                            <label htmlFor="">Coolant</label>
                        </div>

                        {/* <div className={styles['machine-options-inputgroup']} style={{ margin: 0 }}>
                            <label htmlFor="">Laser</label>
                            <ToggleSwitch
                                checked={laser}
                                onChange={() => this.handleToggle('laser')}
                            />
                        </div> */}
                    </div>
                </div>
            </div>
        );
    }
}
