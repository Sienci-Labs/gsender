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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import isElectron from 'is-electron';
//import reduxStore from 'app/store/redux';
//import api from 'app/api';
import controller from 'app/lib/controller';
import AxesWidget from 'app/widgets/JogControl';
import ConsoleWidget from 'app/widgets/Console';
import JobStatusWidget from 'app/widgets/JobStatus';
import LocationWidget from 'app/widgets/Location';
import MacroWidget from 'app/widgets/Macro';
import ProbeWidget from 'app/widgets/Probe';
import SpindleWidget from 'app/widgets/Spindle';
import VisualizerWidget from 'app/widgets/Visualizer';
import SecondaryFunctionality from 'app/widgets/SecondaryFunctionality';

const getWidgetByName = (name) => {
    return {
        'axes': AxesWidget,
        'console': ConsoleWidget,
        'job_status': JobStatusWidget,
        'location': LocationWidget,
        'macro': MacroWidget,
        'probe': ProbeWidget,
        'spindle': SpindleWidget,
        'visualizer': VisualizerWidget,
        'secondary': SecondaryFunctionality
    }[name] || null;
};

class WidgetWrapper extends PureComponent {
    widget = null;

    state = null;
    actions = null;
    name = this.props.widgetId.split(':')[0];

    componentDidMount() {
        if (isElectron()) {
            this.registerIPCListeners();
            // ask main window for state for component we are about to render
            window.ipcRenderer.send('get-state', this.name);
            window.ipcRenderer.send('get-port');
        }
    }

    registerIPCListeners () {
        // recieve state of console from main window
        window.ipcRenderer.on('recieve-state-' + this.name, (event, state) => {
            this.setState(() => {
                return { ...state };
            });
        });
        window.ipcRenderer.on('recieve-port', (event, port) => {
            controller.port = port;
        });
    }

    render() {
        const { widgetId } = this.props;

        if (typeof widgetId !== 'string') {
            return null;
        }

        // e.g. "webcam" or "webcam:d8e6352f-80a9-475f-a4f5-3e9197a48a23"
        const Widget = getWidgetByName(this.name);

        if (!Widget) {
            return null;
        }

        return (
            <Widget
                state={this.state}
                {...this.props}
            />
        );
    }
}

WidgetWrapper.propTypes = {
    widgetId: PropTypes.string.isRequired
};

export default WidgetWrapper;
