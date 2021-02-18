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
        down: 0
    }

    timeout = 250;

    continuousInterval = null;
    timeoutFunction = null;

    onMouseUp(e) {
        const { down } = this.state;
        const { jog, stopContinuousJog } = this.props;

        const timer = new Date() - down;
        clearTimeout((this.timeoutFunction));
        this.timeoutFunction = null;
        if (timer < this.timeout) {
            // console.log('Run click');
            jog();
        } else {
            // console.log('Hold Ended');
            this.continuousInterval && clearInterval(this.continuousInterval);
            this.continuousInterval = null;
            stopContinuousJog();
            this.setState({
                down: 0
            });
        }
    }

    onMouseDown(e) {
        const down = new Date();
        this.setState({
            down: down
        });
        this.timeoutFunction = setTimeout(() => {
            this.props.continuousJog();
        }, this.timeout);
    }

    render() {
        const props = { ...this.props };

        return (
            <button
                className={cx(styles.btnKeypad, props.className)}
                disabled={props.disabled}
                onMouseDown={(e) => this.onMouseDown(e)}
                onMouseUp={(e) => this.onMouseUp(e)}
                onMouseLeave={(e) => this.onMouseUp(e)}
            >
                {props.children}
            </button>
        );
    }
}

export default JogControl;
