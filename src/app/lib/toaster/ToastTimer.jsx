import React, { PureComponent } from 'react';
import styles from './toaster.styl';

class ToastTimer extends PureComponent {
    timer = null ;

    constructor(props) {
        super(props);
        this.state = {
            createdAt: props.createdAt,
            duration: props.duration,
            width: 80
        };
    }

    tick = () => {
        const { createdAt, duration } = this.state;
        const time = Date.now();
        const timeActive = time - createdAt;
        const percentageProgress = ((timeActive / duration) * 100).toFixed(1);

        const width = 100 - percentageProgress;
        this.setState({
            width: width
        });
    }

    componentDidMount() {
        this.timer = setInterval(this.tick, 25);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        const { width } = this.state;
        return (
            <div className={styles.toastProgress}>
                <div className={styles.toastProgressBar} style={{ 'width': `${width}%` }} />
            </div>
        );
    }
}

export default ToastTimer;
