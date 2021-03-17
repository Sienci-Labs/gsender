import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import uuid from 'uuid';
import styles from './toaster.styl';
import Toast from './Toast';

class Toaster extends PureComponent {
    pubsubTokens = [];

    constructor(props) {
        super(props);
        this.state = {
            activeToasts: []
        };
    }

    createNewToast(options = {}) {
        const state = { ...this.state };
        const activeToasts = [...state.activeToasts];
        const toastId = uuid();
        const closeHandler = () => {
            pubsub.publish('toast:remove', toastId);
        };
        activeToasts.push({
            id: toastId,
            closeHandler: closeHandler,
            ...options
        });
        this.setState({
            activeToasts: activeToasts
        });
    }

    removeToast(id) {
        const state = { ...this.state };
        const activeToasts = [...state.activeToasts];
        let filteredToasts = activeToasts.filter((toast) => toast.id !== id);
        this.setState({
            activeToasts: filteredToasts
        });
    }

    subscribe () {
        const tokens = [
            pubsub.subscribe('toast:new', (msg, options) => {
                this.createNewToast(options);
            }),
            pubsub.subscribe('toast:remove', (msg, id) => {
                this.removeToast(id);
            })
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
        const { activeToasts } = this.state;
        return (
            <div className={styles.toasterContainer}>
                {
                    activeToasts.map((toast) => <Toast key={toast.id} {...toast} />)
                }
            </div>
        );
    }
}

export default Toaster;
