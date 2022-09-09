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

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
//import log from 'electron-log';
import store from 'app/store';
import chainedFunction from 'chained-function';
import uuid from 'uuid';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
// import log from 'app/lib/log';
import portal from 'app/lib/portal';
import api from 'app/api';
import WidgetWrapper from './Workspace/Widget';


class PopUpWidget extends Component {
    static propTypes = {
        ...withRouter.propTypes,
        route: PropTypes.string.isRequired
    };

    state = { activeWidgets: [] };

    forkWidget = (widgetId) => () => {
        portal(({ onClose }) => (
            <Modal size="xs" onClose={onClose}>
                <Modal.Header>
                    <Modal.Title>
                        {i18n._('Fork Widget')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {i18n._('Are you sure you want to fork this widget?')}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={onClose}
                    >
                        {i18n._('Cancel')}
                    </Button>
                    <Button
                        btnStyle="primary"
                        onClick={chainedFunction(
                            () => {
                                const name = widgetId.split(':')[0];
                                if (!name) {
                                    api.log.printLog(`Failed to fork widget: widgetId=${widgetId}`, 'popupwidget', 72, 'error');
                                    return;
                                }

                                // Use the same widget settings in a new widget
                                const forkedWidgetId = `${name}:${uuid.v4()}`;
                                const defaultSettings = store.get(`widgets["${name}"]`);
                                const clonedSettings = store.get(`widgets["${widgetId}"]`, defaultSettings);
                                store.set(`widgets["${forkedWidgetId}"]`, clonedSettings);

                                const widgets = [...this.state.widgets, forkedWidgetId];
                                this.setState({ widgets: widgets });

                                this.props.onForkWidget(widgetId);
                            },
                            onClose
                        )}
                    >
                        {i18n._('OK')}
                    </Button>
                </Modal.Footer>
            </Modal>
        ));
    };

    removeWidget = (widgetId) => () => {
        portal(({ onClose }) => (
            <Modal size="xs" onClose={onClose}>
                <Modal.Header>
                    <Modal.Title>
                        {i18n._('Remove Widget')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {i18n._('Are you sure you want to remove this widget?')}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={onClose}
                    >
                        {i18n._('Cancel')}
                    </Button>
                    <Button
                        btnStyle="primary"
                        onClick={chainedFunction(
                            () => {
                                const widgets = this.state.widgets.filter(n => n !== widgetId);
                                this.setState({ widgets: widgets });

                                if (widgetId.match(/\w+:[\w\-]+/)) {
                                    // Remove forked widget settings
                                    store.unset(`widgets["${widgetId}"]`);
                                }

                                this.props.onRemoveWidget(widgetId);
                            },
                            onClose
                        )}
                    >
                        {i18n._('OK')}
                    </Button>
                </Modal.Footer>
            </Modal>
        ));
    };

    render() {
        const id = this.props.location.pathname.replace('/widget/', '');

        return (
            <WidgetWrapper
                widgetId={id}
                onFork={this.forkWidget(id)}
                onRemove={this.removeWidget(id)}
            />
        );
    }
}

export default withRouter(PopUpWidget);
