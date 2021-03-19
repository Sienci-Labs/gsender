import React, { PureComponent } from 'react';
import cx from 'classnames';
import pubsub from 'pubsub-js';
import styles from './index.styl';


class UpdateAvailableAlert extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            shown: false
        };
    }

    actions = {
        hideModal: () => {
            this.setState({
                shown: false
            });
        }
    }

    pubsubTokens = [];


    subscribe () {
        const tokens = [
            pubsub.subscribe('showUpdateToast', (msg) => {
                this.setState({
                    shown: true
                });
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe () {
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
        const { shown } = this.state;
        const { restartHandler } = this.props;
        const actions = { ...this.actions };
        return (
            <div className={cx(styles.updateWrapper, { [styles.hideModal]: !shown })}>
                <div className={styles.updateIcon}>
                    <i className="fas fa-download" />
                </div>
                <div className={styles.updateContent}>
                    <div>
                        Update downloaded and available to install.  Restart now?
                    </div>
                    <button onClick={() => restartHandler()} className={styles.restartButton}>
                        Restart and Install
                    </button>
                </div>
                <div className={styles.closeModal}>
                    <button onClick={actions.hideModal}>
                        <i className="fas fa-times" />
                    </button>
                </div>

            </div>
        );
    }
}

export default UpdateAvailableAlert;
