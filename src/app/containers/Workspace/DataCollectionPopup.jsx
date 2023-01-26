import React, { useState, forwardRef, useImperativeHandle } from 'react';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';
import { USER_DATA_COLLECTION } from '../../constants';
import api from '../../api';

const DataCollectionPopup = (_, ref) => {
    const [toggle, setToggle] = useState(false);

    useImperativeHandle(ref, () => {
        return { show, hide };
    }, []);

    const show = () => setToggle(true);
    const hide = () => setToggle(false);

    const handleAccept = async () => {
        hide();

        await api.metrics.sendData();

        await api.metrics.toggleCollectDataStatus({ collectUserDataStatus: USER_DATA_COLLECTION.ACCEPTED });
    };

    const handleReject = async () => {
        hide();

        await api.metrics.toggleCollectDataStatus({ collectUserDataStatus: USER_DATA_COLLECTION.REJECTED });
    };

    if (toggle === false) {
        return null;
    }

    return (
        <div className={styles.consentPopup}>
            <div className={styles.closeArea}>
                <button type="button" onClick={hide}>
                    <i className="fas fa-times" />
                </button>
            </div>

            <div className={styles.consentArea}>
                <i className="fas fa-user-shield" />
                <div>
                    <h2 style={{ marginBottom: '2rem', fontWeight: 'bold' }}>Anonymous Usage Information</h2>
                    <p>To continue making gSender better we&apos;re trying to get a count on how many people use it, what CNC they use it for, what computer they run it on, and other app usage statistics.</p>

                    <p>This is completely optional and anonymous and we&apos;ll only do it with your permission. You can opt in or out at any time.</p>

                    <div style={{ display: 'flex' }}>
                        <FunctionButton style={{ marginRight: '1rem', backgroundColor: 'white' }} onClick={handleAccept}>Accept</FunctionButton>
                        <FunctionButton style={{ backgroundColor: 'white' }} onClick={handleReject}>Decline</FunctionButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default forwardRef(DataCollectionPopup);
