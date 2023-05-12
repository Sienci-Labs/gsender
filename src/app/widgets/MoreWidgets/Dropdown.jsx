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
import styled from 'styled-components';
import Menu, { MenuItem } from 'rc-menu';
import styles from './index.styl';
import TabsContext from '../SecondaryFunctionality/TabsContext';
import './styles.css';

/**
 * This is a custom dropdown component that allows the user to select
 * one of the extra widgets
 * @props takes current selected tab and context of parent class component to update state
 */
const RcDropdown = ({ hiddenTabs = [], handleHighlightTab }) => {
    const { currentDropdownTab, updateDropdownTab } = useContext(TabsContext);

    const handleTabSelect = (tab) => {
        updateDropdownTab(tab);
        handleHighlightTab(tab);
    };

    const DropdownWrapper = styled.div``;
    const Span = styled.span``;
    const I = styled.i`
        font-size: 2rem !important;
    `;

    const Options = (
        <Menu className={styles.dropdown} activeKey={currentDropdownTab}>
            {hiddenTabs.map((tab) => (
                <MenuItem
                    className={styles.menuItems}
                    onClick={() => handleTabSelect(tab.label)}
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
        <DropdownWrapper>
            <Dropdown trigger={['click', 'hover']} overlay={Options} animation="slide-up">
                <Span><I className="fas fa-ellipsis-h" /></Span>
            </Dropdown>
        </DropdownWrapper>
    );
};

export default RcDropdown;
