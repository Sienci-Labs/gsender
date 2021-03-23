import React, { Component } from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import store from 'app/store';
import Input from '../Input';
import styles from '../index.styl';
import { Toaster, TOASTER_SUCCESS } from '../../../lib/toaster/ToasterLib';
import { convertToImperial, convertToMetric } from '../calculate';

export default class JogSpeeds extends Component {
    state = {
        units: store.get('workspace.units'),
        jogSpeeds: this.getJogSpeeds(),
        currentPreset: { name: 'precise', ...this.getJogSpeeds().precise },
    }

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Settings Updated',
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 5000, { trailing: false });

    pubsubTokens = [];

    getJogSpeeds() {
        const data = store.get('widgets.axes');

        if (!data) {
            return {};
        }
        const { rapid, normal, precise } = data.jog;

        return { rapid, normal, precise };
    }

    handleJogClick = (selected) => {
        const { jogSpeeds } = this.state;

        const speed = jogSpeeds[selected];

        this.setState({ currentPreset: { name: selected, ...speed } });
    }

    updateState = () => {
        const units = store.get('workspace.units');
        const data = store.get('widgets.axes');
        if (!data) {
            this.setState({ units });
            return;
        }

        this.setState({ units, jogSpeeds: this.getJogSpeeds() });
    }

    handleChange = (e) => {
        const id = e.target.id;
        const value = Number(e.target.value);
        const { currentPreset, units } = this.state;

        if (value <= 0) {
            return;
        }

        const metricValue = units === 'mm' ? value : convertToMetric(value);
        const imperialValue = units === 'in' ? value : convertToImperial(value);

        const newObj = {
            ...currentPreset,
            in: {
                ...currentPreset.in,
                [id]: imperialValue
            },
            mm: {
                ...currentPreset.mm,
                [id]: metricValue
            }
        };

        const prev = store.get('widgets.axes');

        const updated = {
            ...prev,
            jog: {
                ...prev.jog,
                [newObj.name]: {
                    mm: newObj.mm,
                    in: newObj.in
                }
            }

        };
        this.setState(prev => ({ currentPreset: {
            ...prev.currentPreset,
            in: newObj.in,
            mm: newObj.mm,
        } }));
        store.replace('widgets.axes', updated);

        this.showToast();
    }

    componentDidMount() {
        store.on('change', this.updateState);
    }

    componentWillUnmount() {
        store.removeListener('change', this.updateState);
    }

    render() {
        const { units, currentPreset } = this.state;
        const { name } = currentPreset;

        const xyValue = currentPreset[units]?.xyStep;
        const zValue = currentPreset[units]?.zStep;
        const speedValue = currentPreset[units]?.feedrate;

        return (
            <div>
                <div className={classnames(styles.jogSpeedWrapper, styles.flexRow)}>
                    <button type="button" onClick={() => this.handleJogClick('precise')} className={styles[name === 'precise' ? 'jog-speed-active' : 'jog-speed-inactive']}>Precise</button>
                    <button type="button" onClick={() => this.handleJogClick('normal')} className={styles[name === 'normal' ? 'jog-speed-active' : 'jog-speed-inactive']}>Normal</button>
                    <button type="button" onClick={() => this.handleJogClick('rapid')} className={styles[name === 'rapid' ? 'jog-speed-active' : 'jog-speed-inactive']}>Rapid</button>
                </div>
                <div className={styles['jog-spead-wrapper']}>

                    <Input
                        label="XY Move"
                        units={units}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number', id: 'xyStep' }}
                        value={xyValue}
                    />

                    <Input
                        label="Z Move"
                        units={units}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number', id: 'zStep' }}
                        value={zValue}
                    />
                    <Input
                        label="Speed"
                        units={`${units}/min`}
                        onChange={this.handleChange}
                        additionalProps={{ type: 'number', id: 'feedrate' }}
                        value={speedValue}
                    />
                </div>
            </div>
        );
    }
}
