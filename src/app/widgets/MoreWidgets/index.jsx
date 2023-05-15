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
import TabsContext from '../SecondaryFunctionality/TabsContext';
import Coolant from '../Coolant';
import Rotary from '../Rotary';
import Console from '../Console';
import Macro from '../Macro';
import Spindle from '../Spindle';

/**
 * This component checks the current selected widget and renders it
 * @props takes the current selected tab/menu
 */
const MoreTabs = ({ onFork, onRemove, sortable, widgetId, active }) => {
    const { currentDropdownTab = 'Coolant' } = useContext(TabsContext);

    let Render = Coolant;

    switch (currentDropdownTab) {
    case 'Coolant':
        Render = Coolant;
        break;
    case 'Rotary':
        Render = Rotary;
        break;
    case 'Console':
        Render = Console;
        break;
    case 'Macros':
        Render = Macro;
        break;
    case 'Spindle/Laser':
        Render = Spindle;
        break;
    default:
        break;
    }

    return (
        <Render
            onFork={onFork}
            onRemove={onRemove}
            sortable={sortable}
            widgetId={widgetId}
            embedded
            active={active}
            isMainWindow={true}
        />
    );
};
export default MoreTabs;
