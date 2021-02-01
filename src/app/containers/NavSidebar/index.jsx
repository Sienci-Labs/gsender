import React, { PureComponent } from 'react';
import NavSidebarLink from './NavSideBarLink';
import styles from './index.styl';
import {
    MODAL_NONE,
    MODAL_PREFERENCES,
} from './constants';
import Preferences from '../Preferences/Preferences';

class NavSidebar extends PureComponent {
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
                <NavSidebarLink url="" icon="fa-hat-wizard" label="Wizard" />
                <NavSidebarLink url="" onClick={() => actions.openModal(MODAL_PREFERENCES)} icon="fa-cog" label="Preferences" />

                {
                    state.modal.name === MODAL_PREFERENCES && <Preferences state={state} modalClose={actions.closeModal} />
                }
            </div>
        );
    }
}

export default NavSidebar;
