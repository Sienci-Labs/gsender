/* eslint-disable new-cap */
/* eslint-disable import/no-useless-path-segments */
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import ArduinoUno from '../FirmwareFlashing/images/ArduinoUno.svg';
import styles from './index.styl';
import Fieldset from '../../../containers/Preferences/FieldSet';

class FirmwareFlashing extends PureComponent {
    state = this.getInitialState();

    actions = {
        startFlash: (port) => {
            controller.command('flash:start', port);
        }
    }

    getInitialState() {
        return {
            port: controller.port,
            alertMessage: ''
        };
    }

    handleFlashing=() => {
        this.actions.startFlash(this.state.port);
    }

    render = () => {
        return (
            <div className={styles.firmwarewrapper}>
                <Fieldset legend="Firmware Flashing">
                    <h3 className={styles.iteminfo}>You can use this wizard to flash Firmware onto compatible controllers only.</h3>
                    <h3 className={styles.iteminfo}>Use with care, or when instructed by Support</h3>
                    <div>
                        <div className={styles.wizardform}>
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
