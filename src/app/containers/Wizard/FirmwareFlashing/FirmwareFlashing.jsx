/* eslint-disable react/jsx-closing-bracket-location */
/* eslint-disable new-cap */
/* eslint-disable import/no-useless-path-segments */
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Toaster } from '../../../lib/toaster/ToasterLib';
import ArduinoUno from '../FirmwareFlashing/images/ArduinoUno.svg';
import styles from './index.styl';
import Fieldset from '../../../containers/Preferences/FieldSet';
import Loading from '../../../components/Loader';
import WarningModal from './WarningModal';


class FirmwareFlashing extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func
    };

    state = this.getInitialState();

    boardChoices = [
        `Arduino Uno on port: ${this.state.port}`
    ];

    board = this.boardChoices[0];

    controllerEvents = {
        'task:finish': () => {
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: 'Flashing completed successfully!' });
            this.props.modalClose();
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_INFO',
            });
        },
        'error': (error) => {
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: 'Error flashing board...' });
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_WARNING',
            });
        },
    }

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }


    actions = {
        startFlash: (port) => {
            controller.command('flash:start', port);
            this.setState({ currentlyFlashing: true });
        }
    }

    getInitialState() {
        return {
            currentlyFlashing: false,
            port: controller.port,
            alertMessage: '',
            warning: false,
            boardOptions: '',
            finishedMessage: ''
        };
    }

    handleFlashing=() => {
        this.setState({ warning: true });
    }

    updateBoard=(event) => {
        this.setState({ board: event });
    }

    handleCloseWarning=() => {
        this.setState({ warning: false });
    }

    flashingStart=() => {
        this.setState({ currentlyFlashing: true });
    }


    BoardOptions = this.boardChoices.map((board, i) => <option value={board} key={i}>{board}</option>)

    render = () => {
        return (
            <div className={classNames(
                styles.hidden,
                styles['settings-wrapper'],
                { [styles.visible]: this.props.active }
            )}
            >
                <div className={styles.firmwarewrapper}>
                    { this.state.warning ? (
                        <WarningModal
                            handleCloseWarning={this.handleCloseWarning}
                            modalClose={this.props.modalClose}
                            boardType={this.boardChoices}
                            flashingStart={this.flashingStart}
                            port={this.state.port}
                        />
                    ) : ''}
                    <Fieldset legend="Firmware Flashing">
                        <h3 className={styles.iteminfo}>You can use this wizard to flash Grbl Firmware onto compatible Arduino Uno boards only.</h3>
                        <h3 className={styles.iteminfo}>Use with care, or when instructed by Support...</h3>
                        <div>
                            <label>
                                    Board:
                                <select
                                    className={styles['flashing-options-select']}
                                    id="boardType"
                                    value={this.board}
                                    onChange={event => this.updateBoard(event.target.value)}
                                >
                                    {this.BoardOptions}
                                </select>
                            </label>
                            <div className={styles.wizardform}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        this.handleFlashing();
                                    }}
                                >Begin
                                </button>
                            </div>
                            {this.state.currentlyFlashing ? <Loading size="lg" overlay={true} /> : ''}
                            <img src={ArduinoUno} className={styles.board} alt="arduino uno" />
                        </div>
                        <p>For more info please visit: <a href="https://sienci.com/dmx-longmill/grbl-firmware/">Sienci.com</a></p>
                    </Fieldset>
                </div>
            </div>
        );
    }
}

export default FirmwareFlashing;
