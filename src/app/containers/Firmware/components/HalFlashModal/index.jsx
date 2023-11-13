import React, { useState, useEffect } from 'react';
import Modal from 'app/components/Modal';
import styles from './index.styl';
import ProgressBar from './ProgressBar';
import Select from 'react-select';
import _get from 'lodash/get';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';

const HalFlashModal = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [portList, setPortList] = useState(_get(reduxStore.getState(), 'connection.ports'));
    const [port, setPort] = useState(controller.port);
    const [isFlashing, setIsFlashing] = useState(true);

    useEffect(() => {
        setNotifications([
            '- Flashing \'slb_orange.hex\' to device...',
            '- Erasing Sectors...',
            '- Parsing Write Data...',
            '- Writing Data...'
        ]);
    });

    const refreshPorts = () => {
        controller.listPorts();
        setPortList(_get(reduxStore.getState(), 'connection.ports') || []);
        if (port !== '' && portList.findIndex((p) => {
            return p.port === port;
        }) === -1) {
            setPort('');
        }
    };

    const notificationsToStr = () => {
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
                    <input type="file" id="firmware_image" accept=".hex"/>
                    <ProgressBar total={1024} sent={256}/>
                    <textarea value={notificationsToStr()} rows="6" cols="70" className={styles.notifications} readOnly={true}/>
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
                                        setIsFlashing(true);
                                    }}
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
