/* eslint-disable no-restricted-globals */
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import IdleInfo from './components/IdleInfo';
import Overrides from './components/Overrides';
import styles from './index.styl';

class JobStatus extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
    };

    render() {
        const { state } = this.props;
        const { isRunningJob } = state;
        return (
            <div className={styles['job-status-wrapper']}>
                {!isRunningJob
                    ? <IdleInfo state={state} />
                    : <Overrides state={state} />
                }
            </div>
        );
    }
}

export default JobStatus;
