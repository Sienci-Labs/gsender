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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from '@trendmicro/react-modal';
import i18n from 'app/lib/i18n';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';
import ProbeCircuitStatus from './ProbeCircuitStatus';
import ProbeImage from './ProbeImage';
import { PROBING_CATEGORY } from '../../constants';
import useKeybinding from '../../lib/useKeybinding';

class RunProbe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    state = this.getInitialState();

    testInterval = null;

    shuttleControlEvents = {
        START_PROBE: {
            title: 'Start Probing',
            keys: '',
            cmd: 'START_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                this.startProbe();
            },
        },
        CONFIRM_PROBE: {
            title: 'Confirm Probe',
            keys: '',
            cmd: 'CONFIRM_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { state, actions } = this.props;
                if (state.connectionMade) {
                    return;
                }

                Toaster.pop({
                    msg: 'Probe Confirmed Manually',
                    type: TOASTER_INFO,
                    duration: 5000,
                    icon: 'fa-satellite-dish'
                });

                actions.setProbeConnectivity(true);
            }
        }
    }

    getInitialState() {
        return {
            testRunning: false
        };
    }

    resetProbeState() {
        this.setState({
            ...this.getInitialState()
        });
    }

    startProbe = () => {
        const { actions } = this.props;

        const probeCommands = actions.generateProbeCommands();
        //console.log(probeCommands);

        actions.runProbeCommands(probeCommands);
        this.resetProbeState();
        Toaster.pop({
            msg: 'Initiated probing cycle',
            type: TOASTER_INFO,
            duration: 5000,
            icon: 'fa-satellite-dish'
        });
        actions.closeModal();
    }

    startConnectivityTest(probeStatus, connectivityTest) {
        const { actions } = this.props;

        // If we disabled test, immediately set connectionMade to true and return
        if (!connectivityTest) {
            actions.setProbeConnectivity(true);
            return;
        }

        this.setState({
            testRunning: true
        });
        this.testInterval = setInterval(() => {
            if (probeStatus()) {
                actions.setProbeConnectivity(true);
                clearInterval(this.testInterval);
                this.testInterval = null;
            }
        }, 500);
    }

    componentDidMount() {
        //this.startConnectivityTest(actions.returnProbeConnectivity, connectivityTest);
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);

        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.testInterval && clearInterval(this.testInterval);
        this.removeShuttleControlEvents();
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    render() {
        const { actions, state, show } = this.props;
        const { canClick, touchplate, connectionMade } = state;
        const { touchplateType } = touchplate;
        //const probeCommands = actions.generateProbeCommands();
        //console.log(probeCommands.join('\n'));
        const probeCommand = state.availableProbeCommands[state.selectedProbeCommand];

        const probeActive = actions.returnProbeConnectivity();

        return (
            <Modal
                disableOverlayClick
                onClose={actions.closeModal}
                show={show}
                className={styles.modalOverride}
            >
                <Modal.Header className={styles.modalHeader}>
                    <Modal.Title>{i18n._(`Probe - ${probeCommand.id}`)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={styles.runProbeBody}>
                        <div className={styles.left}>
                            <div className={styles.greyText}>
                                <p>Ensure tool is positioned as shown.</p>
                                <p>
                                    To confirm a reliable circuit, touch your plate to the tool and look for the signal to be robustly detected
                                    (indicated by a green light) before returning the probe to the probing position.
                                </p>
                                <p>Probing cannot be run without confirming the circuit.</p>
                                <p>Consider holding your touch plate in place during probing to get a more consistent measurement.</p>
                            </div>
                            <FunctionButton
                                primary
                                disabled={!connectionMade}
                                onClick={this.startProbe}
                            >
                                {
                                    connectionMade ? 'Start Probe' : 'Waiting on probe circuit confirmation...'
                                }
                            </FunctionButton>
                        </div>
                        <div className={styles.right}>
                            <ProbeImage probeCommand={probeCommand} touchplateType={touchplateType} />
                            <ProbeCircuitStatus connected={canClick} probeActive={probeActive} />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export default RunProbe;
