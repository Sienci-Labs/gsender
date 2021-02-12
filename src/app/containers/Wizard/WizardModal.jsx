import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FirmwareFlashing from './FirmwareFlashing/FirmwareFlashing';
import FirmwareSettings from './FirmwareSettings/FirmwareSettings';
import styles from './index.styl';


class WizardModal extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func
    };

    state = this.getInitialState();


    getInitialState() {
        return {
            selectedMenu: 0,
            menu: [
                {
                    id: 0,
                    label: 'Firmware Settings',
                    component: FirmwareSettings
                },
                {
                    id: 1,
                    label: 'Firmware Flashing',
                    component: FirmwareFlashing
                }
            ]
        };
    }

    actions = {
        setSelectedMenu: (index) => {
            this.setState({
                selectedMenu: index
            });
        }
    }

    render() {
        const { modalClose } = this.props;
        const state = { ...this.state };
        const actions = { ...this.actions };
        const { menu, selectedMenu } = state;

        return (
            <Modal onClose={modalClose}>
                <div className={styles.wizardContainer}>
                    <div className={styles.wizardContent}>
                        <div className={styles.wizardMenu}>
                            <h3>Wizard</h3>
                            {
                                menu.map((menuItem, index) => (
                                    <button
                                        type="button"
                                        key={`section-${menuItem.label}`}
                                        className={index === selectedMenu ? 'activeMenu' : ''}
                                        onClick={() => actions.setSelectedMenu(index)}
                                    >
                                        { menuItem.label}
                                    </button>
                                ))
                            }
                        </div>
                        <div className={styles.wizardOptions}>
                            {
                                menu.map((menuItem, index) => (
                                    <div key={menuItem.id}>
                                        { <menuItem.component
                                            actions={actions}
                                            state={state}
                                            active={index === selectedMenu}
                                            modalClose={modalClose}
                                        />}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default WizardModal;
