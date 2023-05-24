/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
import React, { useContext } from 'react';
import Dropdown from 'rc-dropdown';
import Menu, { MenuItem } from 'rc-menu';
import styles from './index.styl';
import TabsContext from '../SecondaryFunctionality/TabsContext';
import './styles.css';

/**
 * This is a custom dropdown component that allows the user to select
 * one of the extra widgets
 * @props takes current selected tab and context of parent class component to update state
 */
const RcDropdown = () => {
    const { currentDropdownTab, updateDropdownTab, hiddenTabs } = useContext(TabsContext);

    const handleTabSelect = (tab) => {
        updateDropdownTab(tab.label);
    };

    const Options = (
        <Menu className={styles.dropdown} activeKey={currentDropdownTab}>
            {hiddenTabs.map((tab) => (
                <MenuItem
                    className={styles.menuItems}
                    onClick={() => handleTabSelect(tab)}
                    onKeyDown={null}
                    tabIndex={-1}
                    role="button"
                    key={tab.label}
                >
                    <span>{tab.label}</span>
                </MenuItem>
            ))}
        </Menu>
    );

    return (
        <div>
            <Dropdown trigger={['click', 'hover']} overlay={Options} animation="slide-up">
                <span><i className={['fas fa-ellipsis-h', styles.elipseIcon].join(' ')} /></span>
            </Dropdown>
        </div>
    );
};

export default RcDropdown;
