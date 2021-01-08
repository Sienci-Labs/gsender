import React, { PureComponent } from 'react';
import NavSidebarLink from './NavSideBarLink';
import styles from './index.styl';

class NavSidebar extends PureComponent {
    render() {
        return (
            <div className={styles.Sidebar}>
                <NavSidebarLink url="" icon="fa-ruler" label="Flatten" />
                <NavSidebarLink url="" icon="fa-border-style" label="Surface" />
                <NavSidebarLink url="" icon="fa-wrench" label="Calibrate" />
                <NavSidebarLink url="" icon="fa-hat-wizard" label="Wizard" />
                <NavSidebarLink url="/settings" icon="fa-cog" label="Settings" />
            </div>
        );
    }
}

export default NavSidebar;
