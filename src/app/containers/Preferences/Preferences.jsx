import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import GeneralSettings from './GeneralSettings';
import ToolSettings from './Tools';
import MachineProfiles from './MachineProfiles';
import ProbeSettings from './ProbeSettings';
import styles from './index.styl';


class PreferencesPage extends PureComponent {
    state = this.getInitialState();

    getInitialState() {
        return {
            selectedMenu: 0,
            menu: [
                {
                    label: 'General',
                    component: GeneralSettings
                },
                {
                    label: 'Tools',
                    component: ToolSettings
                },
                {
                    label: 'Machine Profiles',
                    component: MachineProfiles
                },
                {
                    label: 'Probe',
                    component: ProbeSettings
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
                <div className={styles.preferencesContainer}>
                    <div className={styles.preferencesContent}>
                        <div className={styles.preferencesMenu}>
                            <h3>Settings</h3>
                            {
                                menu.map((menuItem, index) => (
                                    <button
                                        type="button"
                                        key={`section-${menuItem.label}`}
                                        className={index === selectedMenu ? 'activeMenu' : ''}
                                        onClick={() => actions.setSelectedMenu(index)}
                                    >
                                        {menuItem.label}
                                    </button>
                                ))
                            }
                        </div>
                        <div className={styles.preferencesOptions}>
                            {
                                menu.map((menuItem, index) => (
                                    <div>
                                        {<menuItem.component
                                            actions={actions}
                                            state={state}
                                            active={index === selectedMenu}
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

export default PreferencesPage;
