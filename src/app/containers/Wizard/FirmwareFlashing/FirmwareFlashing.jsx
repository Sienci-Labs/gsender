/* eslint-disable new-cap */
/* eslint-disable import/no-useless-path-segments */
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import ArduinoUno from '../FirmwareFlashing/images/ArduinoUno.svg';
import styles from './index.styl';
import Fieldset from '../../../containers/Preferences/FieldSet';
import FlashingFirmware from '../../../../server/lib/FirmwareFlashing/firmwareflashing';

class FirmwareFlashing extends PureComponent {
    state = this.getInitialState();


    controllerEvents = {
        'FLASHGRBL': (data, controllerState) => {
            console.log(data);
            console.log(controllerState);
        }
    }

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    getInitialState() {
        return {
            port: controller.port,
            alertMessage: ''
        };
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            console.log(eventName);
            console.log(callback);
            controller.addListener(eventName, callback);
            console.log(controller);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    //THIS FUNCTION IS USED TO TEST .HEX FILES ON CLIENT SIDE. REMOVE WHEN IT WORKS SERVER SIDE
    // readFileAsync = (file) => {
    //     return new Promise((resolve, reject) => {
    //         let reader = new FileReader();
    //         reader.onload = () => {
    //             resolve(reader.result);
    //         };
    //         reader.onerror = reject;
    //         reader.readAsArrayBuffer(file);
    //     });
    // }

    // //THIS FUNCTION IS USED TO TEST .HEX FILES ON CLIENT SIDE. REMOVE WHEN IT WORKS SERVER SIDE
    // handleChangeFile = (file) => {
    //     const reader = new FileReader();
    //     reader.readAsArrayBuffer(file);

    //     reader.onload = event => {
    //         const filecontents = event.target.result;

    //         let avrgirl = new AvrgirlArduino({
    //             board: 'uno',
    //             debug: true
    //         });

    //         avrgirl.flash(filecontents, error => {
    //             if (error) {
    //                 console.error(error);
    //             } else {
    //                 console.info('flash successful');
    //             }
    //         });
    //     };
    // }

    readFileAsync = (file) => {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    //Need to call 'flashGrbl' event here and send it the file that was chosen
    handleChangeFile = (file) => {
        console.log(file);
        controller.socket.emit('flashGrbl', file);
    }


    handleFlashing=() => {
        FlashingFirmware();
    }

    render = () => {
        console.log(JSON.stringify(this.state));
        return (
            <div className={styles.firmwarewrapper}>
                <Fieldset legend="Firmware Flashing">
                    <h3 className={styles.iteminfo}>You can use this wizard to flash Firmware onto compatible controllers only.</h3>
                    <h3 className={styles.iteminfo}>Use with care, or when instructed by Support</h3>
                    <div>
                        <div className={styles.wizardform}>
                            {/* <form id="uploadForm" onSubmit={this.handleSubmit}>
                                <input
                                    id="fileInput"
                                    tabIndex="-1"
                                    type="file"
                                    ref={this.fileInput}
                                    onChange={e => this.handleChangeFile(e.target.files[0])}
                                />
                            </form> */}
                            <button
                                type="button"
                                onClick={this.handleFlashing}
                            >Begin
                            </button>
                        </div>
                        <img src={ArduinoUno} className={styles.board} alt="arduino uno" />
                    </div>
                </Fieldset>
                <Fieldset>
                    <p>For more info please visit: <a href="www.sienci.com">Sienci.com</a></p>
                </Fieldset>
            </div>
        );
    }
}

export default FirmwareFlashing;
