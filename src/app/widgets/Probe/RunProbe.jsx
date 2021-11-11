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
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import styles from './index.styl';
import ProbeCircuitStatus from './ProbeCircuitStatus';
import ProbeImage from './ProbeImage';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';

class RunProbe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    state = this.getInitialState();

    testInterval = null;

    shuttleControlEvents = {
        CONFIRM_PROBE: () => {
            const { actions } = this.props;
            const probeCommands = actions.generateProbeCommands();

            actions.closeModal();
            actions.runProbeCommands(probeCommands);
            this.resetProbeState();
            Toaster.pop({
                msg: 'Initiated probing cycle',
                type: TOASTER_INFO,
                duration: 5000,
                icon: 'fa-satellite-dish'
            });
        }
    }

    getInitialState() {
        return {
            connectionMade: false,
            testRunning: false
        };
    }

    resetProbeState() {
        this.setState({
            ...this.getInitialState()
        });
    }

    startConnectivityTest(probeStatus, connectivityTest) {
        // If we disabled test, immediately set connectionMade to true and return
        if (!connectivityTest) {
            this.setState({
                connectionMade: true
            });
            return;
        }

        this.setState({
            testRunning: true
        });
        this.testInterval = setInterval(() => {
            if (probeStatus()) {
                this.setState({
                    connectionMade: true,
                });
                clearInterval(this.testInterval);
                this.testInterval = null;
            } else {
                const { timer } = this.state;
                this.setState({
                    timer: timer + 0.5
                });
            }
        }, 500);
    }

    componentDidMount() {
        const { actions, state } = this.props;
        const { connectivityTest } = state;
        this.startConnectivityTest(actions.returnProbeConnectivity, connectivityTest);
        this.addShuttleControlEvents();

        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.testInterval && clearInterval(this.testInterval);
        this.removeShuttleControlEvents();
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName];
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName];
            combokeys.removeListener(eventName, callback);
        });
    }

    render() {
        const { actions } = this.props;
        const { state } = this.props;
        const { canClick } = state;
        const probeCommands = actions.generateProbeCommands();
        const probeCommand = state.availableProbeCommands[state.selectedProbeCommand];
        console.log(probeCommands);

        const probeActive = actions.returnProbeConnectivity();
        const { connectionMade } = this.state;

        return (
            <Modal disableOverlay onClose={actions.closeModal}>
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
                            </div>
                            <FunctionButton
                                primary
                                disabled={!connectionMade}
                                onClick={() => {
                                    actions.closeModal();
                                    actions.runProbeCommands(probeCommands);
                                    this.resetProbeState();
                                    Toaster.pop({
                                        msg: 'Initiated probing cycle',
                                        type: TOASTER_INFO,
                                        duration: 5000,
                                        icon: 'fa-satellite-dish'
                                    });
                                }}
                            >
                                {
                                    !connectionMade ? 'Waiting on probe circuit confirmation...' : ' Start Probe'
                                }
                            </FunctionButton>
                        </div>
                        <div className={styles.right}>
                            <ProbeImage probeCommand={probeCommand} />
                            <ProbeCircuitStatus connected={canClick} probeActive={probeActive} />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export default RunProbe;
