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

import difference from 'lodash/difference';
import includes from 'lodash/includes';
// import union from 'lodash/union';
import React from 'react';
import ReactDOM from 'react-dom';
import { GRBL, MARLIN, SMOOTHIE, TINYG } from 'app/constants';
import controller from 'app/lib/controller';
import store from 'app/store';
import defaultState from 'app/store/defaultState';
import WidgetManager from './WidgetManager';

export const getInactiveWidgets = () => {
    const allWidgets = Object.keys(defaultState.widgets);
    const defaultWidgets = store.get('workspace.container.default.widgets', [])
        .map(widgetId => widgetId.split(':')[0]);
    const primaryWidgets = store.get('workspace.container.primary.widgets', [])
        .map(widgetId => widgetId.split(':')[0]);
    const inactiveWidgets = difference(allWidgets, defaultWidgets, primaryWidgets)
        .filter(widget => {
            if (widget === 'grbl' && !includes(controller.loadedControllers, GRBL)) {
                return false;
            }
            if (widget === 'marlin' && !includes(controller.loadedControllers, MARLIN)) {
                return false;
            }
            if (widget === 'smoothie' && !includes(controller.loadedControllers, SMOOTHIE)) {
                return false;
            }
            if (widget === 'tinyg' && !includes(controller.loadedControllers, TINYG)) {
                return false;
            }
            return true;
        });

    return inactiveWidgets;
};

// @param {string} targetContainer The target container: primary|secondary
export const show = (callback) => {
    const el = document.body.appendChild(document.createElement('div'));
    const handleClose = (e) => {
        ReactDOM.unmountComponentAtNode(el);
        setTimeout(() => {
            el.remove();
        }, 0);
    };

    ReactDOM.render(<WidgetManager onSave={callback} onClose={handleClose} />, el);
};
