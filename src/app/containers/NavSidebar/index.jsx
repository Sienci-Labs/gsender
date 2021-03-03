import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import NavSidebarLink from './NavSideBarLink';
import styles from './index.styl';
import {
    MODAL_NONE,
    MODAL_PREFERENCES,
    MODAL_FIRMWARE
} from './constants';
import Preferences from '../Preferences/Preferences';
import WizardModal from '../Wizard/WizardModal';

class NavSidebar extends PureComponent {
    static propTypes = {
        wizardDisabled: PropTypes.bool
    };

    state = this.getInitialState();

    actions = {
        openModal: (name) => {
            this.setState({
                modal: {
                    name: name,
                    params: {}
                }
            });
        },
        closeModal: () => {
            this.setState({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            });
        }
    }

    getInitialState() {
        return {
            modal: {
                name: MODAL_NONE,
                params: {}
            }
        };
    }

    render() {
        const actions = { ...this.actions };
        const state = { ...this.state };
        return (
            <div className={styles.Sidebar}>
                <NavSidebarLink url="" icon="fa-ruler" label="Flatten" />
                <NavSidebarLink url="" icon="fa-border-style" label="Surface" />
                <NavSidebarLink url="" icon="fa-wrench" label="Calibrate" />
                <div className={!this.props.wizardDisabled ? 'enable' : `${styles.disable}`}>
                    <NavSidebarLink
                        url=""
                        onClick={() => actions.openModal(MODAL_FIRMWARE)}
                        icon="fa-hat-wizard"
                        label="Wizard"
                    />
                </div>
                <NavSidebarLink url="" onClick={() => actions.openModal(MODAL_PREFERENCES)} icon="fa-cog" label="" />
                {
                    state.modal.name === MODAL_FIRMWARE && <WizardModal state={state} modalClose={actions.closeModal} />
                }
                {
                    state.modal.name === MODAL_PREFERENCES && <Preferences state={state} modalClose={actions.closeModal} />
                }
            </div>
        );
    }
}

export default NavSidebar;
