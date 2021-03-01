import React, { Component } from 'react';
import classnames from 'classnames';
import pubsub from 'pubsub-js';
import Input from '../Input';

import styles from '../index.styl';

// pubsub.publish('jogSpeeds', { xyStep, zStep, feedrate });
export default class JogSpeeds extends Component {
    state = {
        units: 'mm',
        active: '',
        jogspeeds: {},
    }

    pubsubTokens = [];

    handleJogClick = (active) => {
        this.setState({ active });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('jogSpeeds', (msg, speeds) => {
                this.setState({ speeds });
            }),
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
        const { units, active } = this.state;

        return (
            <div>
                <div className={classnames(styles.jogSpeedWrapper, styles.flexRow)}>
                    <button type="button" onClick={() => this.handleJogClick('precise')} className={styles[active === 'precise' ? 'jog-speed-active' : 'jog-speed-inactive']}>Precise</button>
                    <button type="button" onClick={() => this.handleJogClick('normal')} className={styles[active === 'normal' ? 'jog-speed-active' : 'jog-speed-inactive']}>Normal</button>
                    <button type="button" onClick={() => this.handleJogClick('rapid')} className={styles[active === 'rapid' ? 'jog-speed-active' : 'jog-speed-inactive']}>Rapid</button>
                </div>
                <div className={styles['jog-spead-wrapper']}>

                    <Input
                        label="XY Move"
                        units={units}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number' }}
                    />

                    <Input
                        label="Z Move"
                        units={units}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number' }}
                    />
                    <Input
                        label="Speed"
                        units={`${units}/min`}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number' }}
                    />
                </div>
            </div>
        );
    }
}
