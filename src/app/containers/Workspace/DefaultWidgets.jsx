import classNames from 'classnames';
import React, { PureComponent } from 'react';
import styles from './widgets.styl';
import JobStatusWidget from '../../widgets/JobStatus';
import VisualizerWidget from '../../widgets/Visualizer';

class DefaultWidgets extends PureComponent {
    render() {
        const { className } = this.props;

        return (
            <div className={classNames(className, styles['default-widgets'])}>
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
