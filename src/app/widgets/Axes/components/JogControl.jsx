import React, { PureComponent } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import styles from '../index.styl';

class JogControl extends PureComponent {
    static propTypes = {
        disabled: PropTypes.bool,
        className: PropTypes.string,
        jog: PropTypes.func,
        continuousJog: PropTypes.func,
        stopContinuousJog: PropTypes.func
    };

    state = {
        startTime: 0,
        didClick: false
    }

    timeout = 250;

    continuousInterval = null;
    timeoutFunction = null;

    onMouseUp(e) {
        const { startTime, didClick } = this.state;
        const { jog, stopContinuousJog } = this.props;

        const timer = new Date() - startTime;
        clearTimeout(this.timeoutFunction);
        this.timeoutFunction = null;
        if (timer < this.timeout && didClick) {
            jog();
            this.setState({
                didClick: false,
                timer: new Date()
            });
        } else {
            this.continuousInterval && clearInterval(this.continuousInterval);
            this.continuousInterval = null;
            stopContinuousJog();
            this.setState({
                startTime: new Date(),
                didClick: false
            });
        }
    }

    onMouseDown(e) {
        const startTime = new Date();
        this.setState({
            startTime: startTime,
            didClick: true
        });
        this.timeoutFunction = setTimeout(() => {
            this.props.continuousJog();
        }, this.timeout);
    }

    onMouseLeave(e) {
        const { didClick, startTime } = this.state;
        const timer = new Date() - startTime;
        if (didClick && timer >= this.timeout) {
            this.props.stopContinuousJog();
            this.setState({
                didClick: false,
                startTime: new Date()
            });
        }
    }

    onMouseEnter(e) {
        this.setState({
            startTime: new Date()
        });
    }

    render() {
        const props = { ...this.props };


        return (
            <button
                className={cx(styles.btnKeypad, props.className)}
                disabled={props.disabled}
                onMouseDown={(e) => this.onMouseDown(e)}
                onMouseUp={(e) => this.onMouseUp(e)}
                onMouseLeave={(e) => this.onMouseLeave(e)}
                onMouseEnter={(e) => this.onMouseEnter(e)}
            >
                {props.children}
            </button>
        );
    }
}

export default JogControl;
