/* eslint-disable no-unused-vars */
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
import Select from 'react-select';
import pubsub from 'pubsub-js';
import _ from 'lodash';
import ensureArray from 'ensure-array';
import controller from 'app/lib/controller';
import UneditableInput from 'app/containers/Preferences/components/UneditableInput';
import store from 'app/store';
import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import Fieldset from 'app/containers/Preferences/components/Fieldset';
import defaultProfiles from 'app/containers/Preferences/General/defaultMachineProfiles';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import { convertToImperial, convertToMetric } from 'app/containers/Preferences/calculate';
import styles from './index.styl';


/**
 * Machine Profile Options Component
 */
export default class MachineProfile extends Component {
    state = {
        machineProfiles: defaultProfiles.sort((a, b) => a.company.localeCompare(b.company)),
        machineProfile: store.get('workspace.machineProfile'),
        units: store.get('workspace.units')
    };

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Settings Updated',
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

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
                    xmax: foundProfile.mm.width,
                    ymax: foundProfile.mm.depth,
                    zmax: foundProfile.mm.height,
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
        const { units } = this.state;
        const name = e.target.name;
        const value = Number(Number(e.target.value).toFixed(2)); //.toFixed returns a string, hence the extra Number wrapper

        const metricValue = units === 'mm' ? value : convertToMetric(value);
        const imperialValue = units === 'in' ? value : convertToImperial(value);

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

        const updatedUnits = {
            mm: {
                ...machineProfile.mm,
                [name]: metricValue,
            },
            in: {
                ...machineProfile.in,
                [name]: imperialValue
            }
        };

        const updatedObj = {
            ...machineProfile,
            ...updatedUnits,
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
        const value = !machineProfile[id];
        const updatedObj = {
            ...machineProfile,
            [id]: value
        };

        store.replace('workspace.machineProfile', updatedObj);
        controller.command('machineprofile:load', updatedObj);
    }

    updateMachineProfileFromStore = () => {
        const machineProfile = store.get('workspace.machineProfile');
        const units = store.get('workspace.units');

        this.setState({ machineProfile, units });
    };

    updateMachineProfilesFromSubscriber = (machineProfiles) => {
        this.setState({
            machineProfiles: ensureArray(machineProfiles)
        });

        this.showToast();
    };

    subscribe() {
        const tokens = [
            pubsub.subscribe('updateMachineProfiles', (msg, machineProfiles) => {
                this.updateMachineProfilesFromSubscriber(machineProfiles);
            }),
            pubsub.subscribe('units:change', (_, units) => {
                this.setState({ units });
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
        store.on('replace', this.updateMachineProfileFromStore);
        this.subscribe();
    }

    componentWillUnmount() {
        store.removeListener('replace', this.updateMachineProfileFromStore);
        this.unsubscribe();
    }

    shouldDisableEndstops(state) {
        const { controller } = state;
        const { settings } = controller;
        // Handle case where we aren't connected - user unable to enable
        if (Object.keys(settings).length === 0) {
            return true;
        }
        const controllerSettings = settings.settings;
        const { $22 } = controllerSettings;
        // Handle case where endstops enabled - we should be able to enabled
        if ($22 === '1') {
            return false;
        }
        // default - disable
        return true;
    }

    render() {
        const { machineProfile, machineProfiles, units } = this.state;
        const { mm, in: inches, company, name, type } = machineProfile;
        const label = `${company} ${name} ${' - ' && type}`;

        const { width = 0, depth = 0, height = 0 } = units === 'mm' ? mm : inches;

        return (
            <div className={styles.machineProfileWrapper}>
                <span className={styles.title}>Machine Profile:</span>
                <TooltipCustom content="gSender comes pre-loaded with many CNC machine presets" location="top" sx={{ width: '50%' }}>
                    <Select
                        value={{ label: label }}
                        options={machineProfiles.map(({ id, name, company, type }) => ({ key: id, value: id, label: `${company} ${name} ${' - ' && type}` }))}
                        onChange={this.handleSelect}
                        clearable={false}
                    />
                </TooltipCustom>
            </div>
        );
    }
}
