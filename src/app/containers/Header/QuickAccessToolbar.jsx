/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import styles from './index.styl';

class QuickAccessToolbar extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

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
        return (
            <div className={styles.quickAccessToolbar}>
                <ul className="nav navbar-nav">
                    <li className="btn-group btn-group-sm" role="group">
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={this.command.cyclestart}
                            title={i18n._('Cycle Start')}
                        >
                            <i className="fa fa-repeat" />
                            <Space width="8" />
                            {i18n._('Cycle Start')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={this.command.feedhold}
                            title={i18n._('Feedhold')}
                        >
                            <i className="fa fa-hand-paper-o" />
                            <Space width="8" />
                            {i18n._('Feedhold')}
                        </button>
                    </li>
                    <li className="btn-group btn-group-sm" role="group">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={this.command.homing}
                            title={i18n._('Homing')}
                        >
                            <i className="fa fa-home" />
                            <Space width="8" />
                            {i18n._('Homing')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={this.command.sleep}
                            title={i18n._('Sleep')}
                        >
                            <i className="fa fa-bed" />
                            <Space width="8" />
                            {i18n._('Sleep')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning"
                            onClick={this.command.unlock}
                            title={i18n._('Unlock')}
                        >
                            <i className="fa fa-unlock-alt" />
                            <Space width="8" />
                            {i18n._('Unlock')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={this.command.reset}
                            title={i18n._('Reset')}
                        >
                            <i className="fa fa-undo" />
                            <Space width="8" />
                            {i18n._('Reset')}
                        </button>
                    </li>
                </ul>
            </div>
        );
    }
}

export default QuickAccessToolbar;
