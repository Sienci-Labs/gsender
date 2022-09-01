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
import log from 'electron-log';
// import classNames from 'classnames';
// import Sortable from 'react-sortablejs';
import store from 'app/store';
import Widget from './Workspace/Widget';
// import styles from './Workspace/widgets.styl';
// import logger from '../../server/lib/logger';

// const log = logger();

class PopUpWidget extends Component {
    static propTypes = {
        ...withRouter.propTypes,
        route: PropTypes.string.isRequired
    };

    state = {
        widgets: store.get('workspace.container.primary.widgets')
    };

    render() {
        //const { className } = this.props;
        const widgets = this.state.widgets;
        //const id = this.props.location.pathname.replace('/widget/', '');
        let route = 'console';
        // switch (id) {
        // case '1':
        //     route = 'console';
        //     break;
        // default:
        //     route = '';
        // }
        let widget = null;
        widgets.forEach(widgetId => {
            let name = widgetId.split(':')[0];
            if (name.includes(route)) {
                widget = (
                    <div data-widget-id={widgetId} key={widgetId}>
                        <Widget
                            widgetId={widgetId}
                            onFork={this.forkWidget(widgetId)}
                            onRemove={this.removeWidget(widgetId)}
                        />
                    </div>
                );
            }
        });
        log.debug(route);
        log.debug(widget);

        return (
            // <Sortable
            //     className={classNames(className, styles.widgets)}
            //     options={{
            //         animation: 150,
            //         delay: 0, // Touch and hold delay
            //         group: {
            //             name: 'primary',
            //             pull: true,
            //             put: ['secondary']
            //         },
            //         handle: '.sortable-handle', // Drag handle selector within list items
            //         filter: '.sortable-filter', // Selectors that do not lead to dragging
            //         chosenClass: 'sortable-chosen', // Class name for the chosen item
            //         ghostClass: 'sortable-ghost', // Class name for the drop placeholder
            //         dataIdAttr: 'data-widget-id',
            //         // onStart: this.props.onDragStart,
            //         // onEnd: this.props.onDragEnd
            //     }}
            //     // onChange={(order) => {
            //     //     this.setState({ widgets: ensureArray(order) });
            //     // }}
            // >
            { widget }
            // </Sortable>
        );
    }
}

export default withRouter(PopUpWidget);
