import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from '../index.styl';

export default class JogSpeeds extends Component {
    static propTypes = {
        prop: PropTypes
    }

    state = {
        units: 'mm',
        active: '',
    }

    handleJogClick = (active) => {
        this.setState({ active });
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
                    <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="">XY Move ({units})</label>
                        <div className="input-group" style={{ display: 'block' }}>
                            <input
                                type="text"
                                name="depth"
                                className="form-control"
                                style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center', color: '#3e85c7' }}
                                onChange={this.handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="">Z Move ({units})</label>
                        <div className="input-group" style={{ display: 'block' }}>
                            <input
                                type="text"
                                name="depth"
                                className="form-control"
                                style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center', color: '#3e85c7' }}
                                onChange={this.handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="">Speed ({`${units}/min`})</label>
                        <div className="input-group" style={{ display: 'block' }}>
                            <input
                                type="text"
                                name="depth"
                                className="form-control"
                                style={{ zIndex: '0', fontSize: '1.5rem', textAlign: 'center', color: '#3e85c7' }}
                                onChange={this.handleChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
