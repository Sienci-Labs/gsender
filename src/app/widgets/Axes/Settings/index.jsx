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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import ensureArray from 'ensure-array';
import styled from 'styled-components';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import api from 'app/api';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import { Nav, NavItem } from 'app/components/Navs';
import i18n from 'app/lib/i18n';
import General from './General';
import MDI from './MDI';
import ShuttleXpress from './ShuttleXpress';
import {
    DEFAULT_AXES
} from '../constants';

const TabContent = styled.div`
    padding: 10px 15px;
    min-height: 240px;
`;

const TabPane = styled.div`
    display: ${props => (props.active ? 'block' : 'none')};
`;

class Settings extends PureComponent {
    static propTypes = {
        config: PropTypes.object.isRequired,
        onSave: PropTypes.func,
        onCancel: PropTypes.func
    };

    static defaultProps = {
        onSave: noop,
        onCancel: noop
    };

    config = this.props.config;

    node = {
        general: null,
        mdi: null,
        shuttleXpress: null
    };

    state = {
        activeKey: 'general',

        // General
        general: {
            axes: this.config.get('axes', DEFAULT_AXES),
            jog: {
                imperial: {
                    distances: ensureArray(this.config.get('jog.imperial.distances', []))
                },
                metric: {
                    distances: ensureArray(this.config.get('jog.metric.distances', []))
                }
            }
        },

        // ShuttleXpress
        shuttleXpress: {
            feedrateMin: this.config.get('shuttle.feedrateMin'),
            feedrateMax: this.config.get('shuttle.feedrateMax'),
            hertz: this.config.get('shuttle.hertz'),
            overshoot: this.config.get('shuttle.overshoot')
        }
    };

    save = () => {
        // MDI
        const { records } = this.node.mdi.state;
        api.mdi.bulkUpdate({ records: records })
            .then(() => {
                // TODO
            })
            .catch(() => {
                // TODO
            });

        // General
        const {
            axes = DEFAULT_AXES,
            imperialJogDistances,
            metricJogDistances
        } = this.node.general.value;

        this.config.replace('axes', ensureArray(axes));
        this.config.replace('jog.imperial.distances', ensureArray(imperialJogDistances));
        this.config.replace('jog.metric.distances', ensureArray(metricJogDistances));

        // ShuttleXpress
        const { feedrateMin, feedrateMax, hertz, overshoot } = this.node.shuttleXpress.state;
        this.config.set('shuttle.feedrateMin', feedrateMin);
        this.config.set('shuttle.feedrateMax', feedrateMax);
        this.config.set('shuttle.hertz', hertz);
        this.config.set('shuttle.overshoot', overshoot);
    };

    render() {
        const { general, shuttleXpress } = this.state;

        return (
            <Modal
                disableOverlay
                size="md"
                onClose={this.props.onCancel}
            >
                <Modal.Header>
                    <Modal.Title>{i18n._('Axes Settings')}</Modal.Title>
                </Modal.Header>
                <Modal.Body padding={false}>
                    <Nav
                        navStyle="tabs"
                        activeKey={this.state.activeKey}
                        onSelect={eventKey => {
                            this.setState({ activeKey: eventKey });
                        }}
                        style={{
                            marginTop: 15,
                            paddingLeft: 15
                        }}
                    >
                        <NavItem eventKey="general">{i18n._('General')}</NavItem>
                        <NavItem eventKey="mdi">{i18n._('Custom Commands')}</NavItem>
                        <NavItem eventKey="shuttleXpress">{i18n._('ShuttleXpress')}</NavItem>
                    </Nav>
                    <TabContent>
                        <TabPane active={this.state.activeKey === 'general'}>
                            <General
                                ref={node => {
                                    this.node.general = node;
                                }}
                                axes={general.axes}
                                imperialJogDistances={general.jog.imperial.distances}
                                metricJogDistances={general.jog.metric.distances}
                            />
                        </TabPane>
                        <TabPane active={this.state.activeKey === 'mdi'}>
                            <MDI
                                ref={node => {
                                    this.node.mdi = node;
                                }}
                            />
                        </TabPane>
                        <TabPane active={this.state.activeKey === 'shuttleXpress'}>
                            <ShuttleXpress
                                ref={node => {
                                    this.node.shuttleXpress = node;
                                }}
                                feedrateMin={shuttleXpress.feedrateMin}
                                feedrateMax={shuttleXpress.feedrateMax}
                                hertz={shuttleXpress.hertz}
                                overshoot={shuttleXpress.overshoot}
                            />
                        </TabPane>
                    </TabContent>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={this.props.onCancel}
                    >
                        {i18n._('Cancel')}
                    </Button>
                    <Button
                        btnStyle="primary"
                        onClick={event => {
                            this.save();

                            // Update parent state
                            this.props.onSave(event);
                        }}
                    >
                        {i18n._('Save Changes')}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default Settings;
