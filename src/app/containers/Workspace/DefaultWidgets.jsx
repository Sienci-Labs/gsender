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

import classNames from 'classnames';
import React, { PureComponent } from 'react';
import store from 'app/store';
import pubsub from 'pubsub-js';
import styles from './widgets.styl';
import JobStatusWidget from '../../widgets/JobStatus';
import VisualizerWidget from '../../widgets/Visualizer';


class DefaultWidgets extends PureComponent {
    state = {
        isReverse: store.get('workspace.reverseWidgets', false)
    }

    pubsubTokens = []

    subscribe () {
        const tokens = [
            pubsub.subscribe('widgets:reverse', (msg) => {
                this.setState({
                    isReverse: store.get('workspace.reverseWidgets', false)
                });
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { isReverse } = this.state;
        const { className } = this.props;

        return (
            <div className={classNames(className, styles['default-widgets'], { [styles.marginLeft]: isReverse })}>
                <VisualizerWidget
                    widgetId="visualizer"
                />
                <JobStatusWidget
                    widgetId="job_status"
                />
            </div>
        );
    }
}

export default DefaultWidgets;
