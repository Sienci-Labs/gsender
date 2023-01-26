import React, { useState, forwardRef, useImperativeHandle } from 'react';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import store from 'app/store';

import styles from './index.styl';
import { USER_DATA_COLLECTION } from '../../constants';

const DataCollectionPopup = (_, ref) => {
    const [toggle, setToggle] = useState(false);

    useImperativeHandle(ref, () => {
        return { show, hide };
    }, []);

    const show = () => setToggle(true);
    const hide = () => setToggle(false);

    const handleAccept = () => {
        hide();

        //TODO: Immeditately make API call and send user data

        //TODO: Set store setting to collect user data when app in use
        store.replace('workspace.collectUserData', USER_DATA_COLLECTION.ACCEPTED);
    };

    const handleReject = () => {
        hide();

        //TODO: Set store setting to NOT collect user data when app in use
        store.replace('workspace.collectUserData', USER_DATA_COLLECTION.REJECTED);
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
                <i className="fas fa-database" />
                <div>
                    <h2>Data Collection</h2>
                    <p>gSender will be collecting your data periodically to help us improve the app as best we can. You can opt in or out at any time.</p>

                    <div style={{ display: 'flex' }}>
                        <FunctionButton style={{ marginRight: '1rem', backgroundColor: 'white' }} onClick={handleAccept}>Accept</FunctionButton>
                        <FunctionButton style={{ backgroundColor: 'white' }} onClick={handleReject}>Reject</FunctionButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default forwardRef(DataCollectionPopup);
