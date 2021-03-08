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
            '/settings',
            '/settings/general',
            '/settings/workspace',
            '/settings/machine-profiles',
            '/settings/user-accounts',
            '/settings/controller',
            '/settings/commands',
            '/settings/events',
            '/settings/about'
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
