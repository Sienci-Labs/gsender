import React from 'react';
import styles from './index.styl';
import ReconnectButton from './ReconnectButton';

const NotConnectedWarning = ({ handleConnect }) => {
    return (
        <div>
            <h1 className={styles.warningHeader}>You must be connected to change the GRBL EEPROM settings.</h1>
            <p className={styles.warningExplanation}>Connect to your last connected device using the button below or exit this window and connect to a different device.</p>
            <ReconnectButton onClick={handleConnect} />
        </div>
    );
};

export default NotConnectedWarning;
