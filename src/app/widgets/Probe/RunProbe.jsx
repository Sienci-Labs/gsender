import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
import Image from 'app/components/Image';
import ProbeTimer from './ProbeTimer';
import styles from './index.styl';
import ProbeCircuitStatus from './ProbeCircuitStatus';
import XYZProbe from './assets/xyz_probe.png';

class RunProbe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    state = this.getInitialState();

    steps = [
        {
            title: 'Confirm Touchplate Connection',
            description: 'Touch the touchplate to the bit to confirm that everything is connected correctly and a circuit can be formed.'
        },
        {
            title: 'Confirm Router Position',
            description: 'Router should be positioned above the lower left corner of the touchplate if you\'re probing Z, XY, or XYZ.  It should be positioned horizontal to the X or Y axis if you\'re probing those.'
        },
        {
            title: 'Run Probe',
            description: 'You\'re now ready to run the selected probe operation!'
        }
    ];

    getInitialState() {
        return {
            currentStep: 0,
            timer: 0,
            probeActive: false,
            testRunning: false
        };
    }

    resetProbeState() {
        this.setState({
            ...this.getInitialState()
        });
    }

    runConnectivityTest(probeStatus) {
        this.setState({
            testRunning: true
        });
        const interval = setInterval(() => {
            if (probeStatus()) {
                this.setState({
                    timer: 0,
                    probeActive: true,
                    currentStep: 1
                });
                clearInterval(interval);
            } else {
                const { timer } = this.state;
                this.setState({
                    timer: timer + 1
                });
            }
        }, 1000);
        setTimeout(() => {
            clearInterval(interval);
        }, 15000);
    }

    verifyProbePosition() {
        this.setState({
            currentStep: 2
        });
    }

    render() {
        const { actions } = this.props;
        const { state } = this.props;
        const { canClick } = state;
        const probeCommands = actions.generateProbeCommands();
        //const content = probeCommands.join('\n');
        const probeCommand = state.availableProbeCommands[state.selectedProbeCommand];
        const probeActive = actions.returnProbeConnectivity();
        const { timer, testRunning, currentStep } = this.state;

        return (
            <Modal disableOverlay onClose={actions.closeModal}>
                <Modal.Header classnames={styles.modalHeader}>
                    <Modal.Title>{i18n._(`Probe - ${probeCommand.id}`)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={styles.runProbeBody}>

                        <div className={styles.left}>
                            <div>
                                <h5>{ this.steps[currentStep].title } </h5>
                                <span>{ this.steps[currentStep].description }</span>
                            </div>
                            {
                                (currentStep === 0) &&
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    disabled={(currentStep !== 0) && !testRunning}
                                    onClick={() => this.runConnectivityTest(actions.returnProbeConnectivity)}
                                >
                                    {i18n._('Confirm Probe Connectivity')}
                                </button>
                            }
                            {
                                (currentStep === 1) &&
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    disabled={currentStep !== 1}
                                    onClick={() => this.verifyProbePosition()}
                                >
                                    {i18n._('Confirm Router Position')}
                                </button>
                            }
                            {
                                (currentStep === 2) &&
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={currentStep !== 2}
                                    onClick={() => {
                                        actions.closeModal();
                                        actions.runProbeCommands(probeCommands);
                                        this.resetProbeState();
                                    }}
                                >
                                    {i18n._('Run Probe')}
                                </button>
                            }
                        </div>
                        <div className={styles.right}>
                            {
                                (currentStep === 0) &&
                                <div>
                                    <ProbeCircuitStatus connected={canClick} probeActive={probeActive}/>
                                    <ProbeTimer timer={timer} testRunning={testRunning} />
                                </div>
                            }
                            {
                                (currentStep === 1) &&
                                    <Image
                                        src={XYZProbe}
                                    />
                            }
                            {
                                (currentStep === 1) && true
                            }
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export default RunProbe;
