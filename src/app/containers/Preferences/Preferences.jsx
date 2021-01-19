import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import styles from './index.styl';


class PreferencesPage extends PureComponent {
    actions = {
    }

    render() {
        const { modalClose } = this.props;

        return (
            <Modal onClose={modalClose}>
                <div className={styles.preferencesContainer}>
                    <div className={styles.preferencesContent}>
                        Hi
                    </div>
                </div>
            </Modal>
        );
    }
}

export default PreferencesPage;
