import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import controller from 'app/lib/controller';

import ControlButton from './ControlButton';
import styles from './top-access-control.styl';

export default class TopAccessControl extends Component {
    static propTypes = {
        activeTab: PropTypes.number,
        setCurrentTab: PropTypes.func,
    }

    command = {
        'cyclestart': () => {
            controller.command('cyclestart');
        },
        'feedhold': () => {
            controller.command('feedhold');
        },
        'homing': () => {
            controller.command('homing');
        },
        'sleep': () => {
            controller.command('sleep');
        },
        'unlock': () => {
            controller.command('unlock');
        },
        'reset': () => {
            controller.command('reset');
        }
    };

    render() {
        const { activeTab, setCurrentTab } = this.props;

        const tabs = [
            { id: 0, title: 'Visualizer', active: activeTab === 0, handleClick: () => setCurrentTab(0) },
            { id: 1, title: 'G-Code', active: activeTab === 1, handleClick: () => setCurrentTab(1) },
        ];

        const controlButtons = [
            { id: 0, title: 'Home', icon: <i className="fas fa-home" />, onClick: this.command.homing, disabled: false },
            { id: 1, title: 'Release', icon: <i className="fas fa-arrow-alt-circle-up" />, onClick: this.command.unlock, disabled: false },
            { id: 2, title: 'Reset', icon: <i className="fas fa-undo" />, onClick: this.command.reset, disabled: false },
        ];

        return (
            <div className={styles['top-access-control']}>
                <div className={styles['visualizer-tabs']}>
                    {
                        tabs.map(({ id, title, active, handleClick }) => (
                            <div
                                key={id} role="button" tabIndex="-1"
                                onKeyDown={handleClick} onClick={handleClick}
                                className={classnames(styles['v-tab-item'], active ? styles.active : '')}
                            >
                                {title}
                            </div>
                        ))
                    }
                </div>

                <div className={styles['v-control-area']}>
                    {
                        controlButtons.map(({ id, title, icon, onClick, disabled }) => <ControlButton key={id} label={title} icon={icon} onClick={onClick} disabled={disabled} />)
                    }
                </div>
            </div>
        );
    }
}
