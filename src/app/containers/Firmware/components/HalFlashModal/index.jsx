import React, { useState, useEffect, useRef } from 'react';
import Modal from 'app/components/Modal';
import controller from 'app/lib/controller';
import styles from './index.styl';
import ProgressBar from './ProgressBar';
import Select from 'react-select';
import _get from 'lodash/get';
import reduxStore from 'app/store/redux';
import { startFlash } from 'Containers/Firmware/utils';

const HalFlashModal = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [portList, setPortList] = useState(_get(reduxStore.getState(), 'connection.ports'));
    const [port, setPort] = useState(controller.port);
    const [isFlashing, setIsFlashing] = useState(false);
    const fileInputRef = useRef();
    const [file, setFile] = useState(0);
    const [fileContent, setFileContent] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [curValue, setCurValue] = useState(0);

    useEffect(() => {
        setNotifications([]);

        controller.addListener('flash:progress', (value, total) => {
            setCurValue(value);
            if (totalSize !== total) {
                setTotalSize(total);
            }
        });
    }, []);

    useEffect(() => {
        // Listen to flash events
        controller.addListener('flash:message', (msg) => {
            let data = `${msg.type}: ${msg.content}`;
            setNotifications([
                data,
                ...notifications,
            ]);
        });

        controller.addListener('flash:end', () => {
            setNotifications([
                'Flash completed, please reset your board',
                ...notifications,
            ]);
            setIsFlashing(false);
        });

        return () => {
            controller.removeListener('flash:message');
            controller.removeListener('flash:end');
        };
    }, [notifications]);


    useEffect(() => {
        let fileReader, isCancel = false;
        if (file) {
            fileReader = new FileReader();
            fileReader.onload = (e) => {
                const { result } = e.target;
                if (result && !isCancel) {
                    setFileContent(result);
                }
            };
            fileReader.readAsText(file);
        }
        return () => {
            isCancel = true;
            if (fileReader && fileReader.readyState === 1) {
                fileReader.abort();
            }
        };
    }, [file]);

    const refreshPorts = () => {
        controller.listPorts();
        setPortList(_get(reduxStore.getState(), 'connection.ports') || []);
        if (port !== '' && portList.findIndex((p) => {
            return p.port === port;
        }) === -1) {
            setPort('');
        }
    };

    const onChangefileInput = (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.error('No file found');
            return;
        }
        setFile(file);
    };

    const getNotificationsString = () => {
        return notifications.join('\n');
    };

    return (
        <Modal onClose={onClose} className={styles.modal}>
            <div className={styles.wrapper}>
                <div className={styles.body}>
                    <Select
                        placeholder="select"
                        styles={{
                            placeholder: (base) => ({
                                ...base,
                                fontSize: '1em',
                                color: '#D3D3D3',
                                fontWeight: 400,
                            }),
                        }}
                        value={port ? { value: port, label: port } : ''}
                        options={portList.map((element) => {
                            return { value: element.port, label: element.port };
                        })}
                        onChange={(e) => {
                            setPort(e.value);
                        }}
                    />
                    <label htmlFor="firmware_image">Choose a hex file</label>
                    <input type="file" id="firmware_image" accept=".hex" ref={fileInputRef} onChange={onChangefileInput}/>
                    <ProgressBar total={totalSize} sent={curValue}/>
                    <textarea value={getNotificationsString()} rows="6" cols="70" className={styles.notifications} readOnly={true}/>
                </div>
                {
                    !isFlashing &&
                    (
                        <div className="modal-footer">
                            <h1 className="footer-text">This process will disconnect your machine and may take a couple of minute to complete.</h1>
                            <h1 className="footer-textTwo">Continue?</h1>
                            <div className="buttonContainer">
                                <button onClick={onClose} className="button-no">No</button>
                                <button
                                    className="button" onClick={() => {
                                        if (!fileContent || !file) {
                                            console.error('No file');
                                            return;
                                        }
                                        setIsFlashing(true);
                                        startFlash(port, null, fileContent, true);
                                    }
                                    }
                                    onMouseEnter={refreshPorts}
                                    onMouseLeave={refreshPorts}
                                >Yes
                                </button>
                            </div>
                        </div>
                    )
                }

            </div>
        </Modal>
    );
};

export default HalFlashModal;
