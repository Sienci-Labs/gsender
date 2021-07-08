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

import React, { PureComponent } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import pubsub from 'pubsub-js';
import { trackPage } from '../lib/analytics';
import Workspace from './Workspace';
import styles from './App.styl';

class App extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes
    };

    componentDidMount() {
        // Force visualizer to resize once app is loaded
        pubsub.publish('resize');
    }

    render() {
        const { location } = this.props;
        const accepted = ([
            '/workspace',
        ].indexOf(location.pathname) >= 0);

        if (!accepted) {
            return (
                <Redirect
                    to={{
                        pathname: '/workspace',
                        state: {
                            from: location
                        }
                    }}
                />
            );
        }

        trackPage(location.pathname);

        return (
            <div className={styles.main}>
                <Workspace
                    {...this.props}
                    style={{
                        display: (location.pathname !== '/workspace') ? 'none' : 'block'
                    }}
                />
            </div>
        );
    }
}

export default withRouter(App);
