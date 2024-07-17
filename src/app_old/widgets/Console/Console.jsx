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
import i18n from 'app/lib/i18n';
import Terminal from './Terminal';
import styles from './index.styl';

class Console extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        active: PropTypes.bool,
    };

    terminal = null;

    render() {
        const { state, actions } = this.props;
        const { port } = state;

        if (!port) {
            return (
                <div className={styles.noSerialConnection}>
                    {i18n._('Not connected to a device')}
                </div>
            );
        }

        return (
            <Terminal
                ref={node => {
                    if (node) {
                        this.terminal = node;
                    }
                }}
                cols={state.terminal.cols}
                rows={state.terminal.rows}
                cursorBlink={state.terminal.cursorBlink}
                scrollback={state.terminal.scrollback}
                tabStopWidth={state.terminal.tabStopWidth}
                onData={actions.onTerminalData}
                active={this.props.active}
            />
        );
    }
}

export default Console;
