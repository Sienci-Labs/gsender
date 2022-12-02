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

import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import uuid from 'uuid';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';

import isElectron from 'is-electron';

import color from 'cli-color';
import { GREY } from './variables';

import WidgetConfig from '../WidgetConfig';
import Console from './Console';
import styles from './index.styl';
import PopOutButton from '../../components/PopOutButton';

// The buffer starts with 254 bytes free. The terminating <LF> or <CR> counts as a byte.
const TERMINAL_COLS = 50;
const TERMINAL_ROWS = 12;

class ConsoleWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object,
        embedded: PropTypes.bool,
        active: PropTypes.bool
    };

    senderId = uuid.v4();

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    hasSetState = false;

    name = this.props.widgetId.split(':')[0];

    actions = {
        toggleFullscreen: () => {
            this.setState(state => ({
                minimized: state.isFullscreen ? state.minimized : false,
                isFullscreen: !state.isFullscreen,
                terminal: {
                    ...state.terminal,
                    rows: state.isFullscreen ? TERMINAL_ROWS : 'auto'
                }
            }));
        },
        toggleMinimized: () => {
            this.setState(state => ({
                minimized: !state.minimized
            }));
        },
        clearAll: () => {
            this.terminal && this.terminal.clear();
        },
        onTerminalData: (data) => {
            const context = {
                __sender__: this.senderId
            };
            controller.write(data, context);
        }
    };

    controllerEvents = {
        'serialport:open': (options) => {
            const { port, baudrate } = options;
            this.setState({ port: port });

            if (this.terminal) {
                this.terminal.refitTerminal();
                this.terminal.writeln(color.white.bold(`gSender - [${controller.type}]`));
                this.terminal.writeln(color.white(i18n._('Connected to {{-port}} with a baud rate of {{baudrate}}', { port: color.yellowBright(port), baudrate: color.blueBright(baudrate) })));

                this.terminal.updateTerminalHistory(`gSender - [${controller.type}]`);
                this.terminal.updateTerminalHistory(i18n._('Connected to {{-port}} with a baud rate of {{baudrate}}', { port: port, baudrate: baudrate }));
            }
        },
        'serialport:close': (options) => {
            this.actions.clearAll();

            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'serialport:write': (data, context) => {
            const { source, __sender__ } = { ...context };

            if (__sender__ === this.senderId) {
                // Do not write to the terminal console if the sender is the widget itself
                return;
            }

            if (!this.terminal) {
                return;
            }

            data = String(data).trim();
            // Handle non-ascii characters more gracefully
            data = data.replace(/[^\x20-\x7E]/g, (m) => {
                return '\\x' + m.charCodeAt(0).toString(16);
            });

            if (source) {
                this.terminal.writeln(color.blackBright(source) + color.xterm(GREY)(this.terminal.prompt + data));
            } else {
                this.terminal.writeln(color.white(this.terminal.prompt + data));
            }

            this.terminal.updateTerminalHistory(this.terminal.prompt + data);
        },
        'serialport:read': (data) => {
            if (!this.terminal) {
                return;
            }

            this.terminal.writeln(data);
            this.terminal.updateTerminalHistory(data);
        }
    };

    terminal = null;

    pubsubTokens = [];

    componentDidMount() {
        this.addControllerEvents();
        if (isElectron()) {
            this.registerIPCListeners();
        }
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized
        } = this.state;

        this.config.set('minimized', minimized);

        if (isElectron() && !this.hasSetState && this.props.state) {
            this.setHasSetState();
        }
    }

    setHasSetState() {
        this.hasSetState = true;
        this.setState(this.props.state);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            port: controller.port,

            // Terminal
            terminal: {
                cols: TERMINAL_COLS,
                rows: TERMINAL_ROWS,
                cursorBlink: true,
                scrollback: 1000,
                tabStopWidth: 4
            }
        };
    }

    registerIPCListeners () {
        // send state of this console to the new window
        window.ipcRenderer.on('get-data-' + this.name, (event) => {
            const data = { state: this.state, port: controller.port };
            window.ipcRenderer.send('recieve-data', { widget: this.name, data: data });
        });
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    render() {
        const { widgetId, embedded, active, isMainWindow } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state
        };
        const actions = {
            ...this.actions
        };

        return (
            <Widget fullscreen={isFullscreen}>
                {
                    isMainWindow && (
                        <Widget.Header embedded={embedded}>
                            <Widget.Title>
                                {isForkedWidget &&
                                <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                                }
                                {i18n._('Console')}
                            </Widget.Title>
                            <Widget.Controls />
                        </Widget.Header>
                    )
                }
                <Widget.Content
                    className={cx(
                        styles.widgetContent,
                        { [styles.popOut]: !isMainWindow },
                        styles.terminalContent,
                        { [styles.hidden]: minimized },
                        { [styles.fullscreen]: isFullscreen }
                    )}
                    style={{ width: '100%' }}
                >
                    <Console
                        ref={node => {
                            if (node) {
                                this.terminal = node.terminal;
                            }
                        }}
                        state={state}
                        actions={actions}
                        active={active}
                    />
                    {
                        isElectron() && this.props.isMainWindow &&
                        <PopOutButton id={widgetId} state={state} />
                    }
                </Widget.Content>
            </Widget>
        );
    }
}

export default ConsoleWidget;
