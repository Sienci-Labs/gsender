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
