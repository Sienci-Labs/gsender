/* eslint-disable no-return-assign */
/* eslint-disable array-callback-return */

import React, { PureComponent } from 'react';
import map from 'lodash/map';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import controller from '../../../lib/controller';
import Controller from '../../../widgets/Grbl/Controller';
import { Toaster, TOASTER_INFO } from '../../../lib/toaster/ToasterLib';
import styles from './styles.styl';


class ImportExport extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func,
        active: PropTypes.bool
    }

    constructor(props) {
        super(props);

        const defaultFileType = 'text';
        this.fileNames = {
            // gcode: 'Eeprom.gcode',
            text: 'Eeprom.txt'
        };
        this.state = {
            fileType: defaultFileType,
            fileDownloadUrl: null,
            status: '',
            data: [controller.settings],
            port: controller.port,
            settings: controller.settings,
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            }
        };
        this.changeFileType = this.changeFileType.bind(this);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.openFile = this.openFile.bind(this);
    }

    changeFileType(event) {
        const value = event.target.value;
        this.setState({ fileType: value });
    }

    download(event) {
        event.preventDefault();
        // Prepare the file
        let output = JSON.stringify(this.state.data[0].settings);

        // Download it
        const blob = new Blob([output]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        this.setState({ fileDownloadUrl: fileDownloadUrl },
            () => {
                this.dofileDownload.click();
                URL.revokeObjectURL(fileDownloadUrl); // free up storage--no longer needed.
                this.setState({ fileDownloadUrl: '' });
            });
    }

    upload(event) {
        event.preventDefault();
        this.dofileUpload.click();
    }


    openFile(evt) {
        let status = []; // Status output
        const fileObj = evt.target.files[0];
        const reader = new FileReader();

        let fileloaded = e => {
            // e.target.result is the file's content as text
            const fileContents = e.target.result;
            this.setState({ uploadedSettings: fileContents });
            status.push(`File name: "${fileObj.name}". Length: ${fileContents.length} bytes.`);
            // Show first 80 characters of the file
            const first80char = fileContents.substring(0, 80);
            status.push(`First 80 characters of the file:\n${first80char}`);
            if (first80char[3] !== '0') {
                Toaster.pop({
                    msg: 'Incorrect file format',
                    type: TOASTER_INFO
                });
            } else {
                this.setState({ properFormatFile: true });
            }
            this.setState({ status: status.join('\n') });
        };

        // Mainline of the method
        fileloaded = fileloaded.bind(this);
        reader.onload = fileloaded;
        reader.readAsText(fileObj);
    }

    gcode(cmd, params) {
        const s = map(params, (value, letter) => String(letter + value)).join('=');
        return (s.length > 0) ? (cmd + '' + s) : cmd;
    }

    applySettings = () => {
        let uploadedSettings = this.state.uploadedSettings;
        const obj = JSON.parse(uploadedSettings);
        let values = Object.values(obj);
        if (values.length === 34) {
            for (let i = 0; i < values.length; i++) {
                if (values[i] === true) {
                    values[i] = '1';
                } if (values[i] === false) {
                    values[i] = '0';
                }
            }

            let keys = Object.keys(obj);
            let finalStrings = [];
            const valuesToSubmit = [];
            for (let i = 0; i < keys.length; i++) {
                valuesToSubmit.push([keys[i], values[i]]);
            }
            let gCoded = this.gcode(valuesToSubmit);

            //loops through array values, concatinates them with =
            for (let j = 0; j < gCoded.length; j++) {
                finalStrings[j] = gCoded[j].join('=');
            }
            controller.command('gcode', finalStrings);
            controller.command('gcode', '$$');//Needed so next time wizard is opened changes are reflected
            Toaster.pop({
                msg: 'Eeprom values updated!',
                type: TOASTER_INFO
            });
            this.props.modalClose();
        } else {
            Toaster.pop({
                msg: 'Incorrect file format, please try again',
                type: TOASTER_INFO
            });
        }
    }

    controllerEvents = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({
                port: port
            });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'serialport:settings': (type, controllerSettings) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: Controller.settings
                },
                data: Controller.settings
            }));
        },
        'controller:state': (type, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    state: controllerState
                }
            }));
        }
    };

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

    render() {
        const settingNumber = Object.keys(this.state.data[0].settings);
        const settingvalue = Object.values(this.state.data[0].settings);
        return (
            <div className={classNames(
                styles.hidden,
                styles.header,
                { [styles.visible]: this.props.active }
            )}
            >
                <div className={styles.currentsettings}>
                    <h1>Your current settings:</h1>
                    <div className={styles.settingscontainer}>
                        {settingNumber.map((number, item) => (
                            <h1
                                className={styles.settingvalues}
                                key={item}
                            >
                                {`${number}:${settingvalue[item]}`}
                            </h1>
                        ))}
                    </div>
                    <form>
                        <button
                            type="button"
                            onClick={this.download}
                        >
                        Download your settings!
                        </button>

                        <a
                            className="hidden"
                            download={this.fileNames[this.state.fileType]}
                            href={this.state.fileDownloadUrl}
                            ref={e => this.dofileDownload = e}
                        >download it
                        </a>

                        <p>
                            <button
                                type="button"
                                onClick={this.upload}
                            >
                        Upload your settings!
                            </button> Only text files are ok.
                        </p>

                        <input
                            type="file" className="hidden"
                            multiple={false}
                            // accept=".gcode,.txt,.text,application/json,text/,text/plain"
                            accept=".gcode,.txt"
                            onChange={evt => this.openFile(evt)}
                            ref={e => this.dofileUpload = e}
                        />
                    </form>
                    <pre className="status">{this.state.status}</pre>
                    {this.state.properFormatFile
                        ? (
                            <div>
                                <h1>Do you want to apply uploaded settings?</h1>
                                <p>
                                    <button
                                        type="button"
                                        onClick={this.applySettings}
                                    >
                                    Apply your settings?
                                    </button>
                                </p>
                            </div>
                        ) : ''}
                </div>
            </div>
        );
    }
}

export default ImportExport;
