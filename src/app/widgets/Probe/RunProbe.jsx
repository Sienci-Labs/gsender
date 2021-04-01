import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
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

    startConnectivityTest(probeStatus) {
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
        const { actions } = this.props;
        this.startConnectivityTest(actions.returnProbeConnectivity);
    }

    componentWillUnmount() {
        clearInterval(this.testInterval);
    }

    render() {
        const { actions } = this.props;
        const { state } = this.props;
        const { canClick } = state;
        const probeCommands = actions.generateProbeCommands();
        const probeCommand = state.availableProbeCommands[state.selectedProbeCommand];
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
