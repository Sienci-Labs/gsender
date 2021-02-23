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
                <div data-widget-id="visualizerWrapper" className={styles['default-widget-wrapper']}>
                    <VisualizerWidget
                        widgetId="visualizer"
                    />
                </div>
                <div data-widget-id="job_status" key="job_status" className={styles['default-widget-wrapper']}>
                    <JobStatusWidget
                        widgetId="job_status"
                    />
                </div>
            </div>
        );
    }
}

export default DefaultWidgets;
