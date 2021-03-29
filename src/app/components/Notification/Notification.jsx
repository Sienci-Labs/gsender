import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import styles from './index.styl';

class Notification extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func,
        message: PropTypes.string,
        onYes: PropTypes.func,
        onClose: PropTypes.func,
        stopFlashing: PropTypes.func,
    };

    handleNo = () => {
        this.props.modalClose();
    }

    handleYes = () => {
        this.props.onYes();
    }


    render() {
        const { onClose } = this.props;


        return (
            <Modal>
                <div className={styles.modalContainer}>
                    <div className="fas fa-exclamation" style={{ fontSize: 40, color: '#3e85c7', textAlign: 'center', marginTop: 30 }} />
                    <h3 className={styles.notificationHeader}>Are You Sure?</h3>
                    <div className={styles.notificationMessage}>{this.props.message}</div>
                    <div className={styles.notificationButtonContainer}>
                        <button type="button" className={styles.notificationButtons} onClick={this.handleYes}>Yes</button>
                        <button type="button" className={styles.notificationButtons} onClick={onClose}>No</button>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default Notification;
