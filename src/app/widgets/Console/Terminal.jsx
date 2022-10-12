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
import PerfectScrollbar from 'perfect-scrollbar';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { debounce } from 'lodash';

import store from 'app/store';
import Button from 'app/components/FunctionButton/FunctionButton';
import controller from 'app/lib/controller';
import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import color from 'cli-color';
import { RED, ALARM_RED } from './variables';

import History from './History';
import styles from './index.styl';

const LINES_TO_COPY = 50;
class TerminalWrapper extends PureComponent {
    static propTypes = {
        cols: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        rows: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        cursorBlink: PropTypes.bool,
        scrollback: PropTypes.number,
        tabStopWidth: PropTypes.number,
        onData: PropTypes.func,
        active: PropTypes.bool,
    };

    static defaultProps = {
        cols: 'auto',
        rows: 'auto',
        cursorBlink: false,
        scrollback: 1000,
        tabStopWidth: 4,
        onData: () => {}
    };

    state = {
        terminalInputHistory: store.get('workspace.terminal.inputHistory', []),
        terminalInputIndex: store.get('workspace.terminal.inputHistory')?.length
    }

    prompt = ' ';

    history = new History(1000);

    verticalScrollbar = null;

    terminalContainer = null;

    term = null;

    fitAddon = null;

    debounce = debounce

    inputRef = React.createRef()

    eventHandler = {
        onKey: (() => {
            return async (event) => {
                const term = this.term;
                const line = term.getSelection();

                if (!line) {
                    return;
                }

                // Ctrl-C copy - ctrl + c on windows/linux, meta-c on mac
                if ((event.ctrlKey || event.metaKey) && (event.code === 'KeyC')) {
                    await navigator.clipboard.writeText(line);
                    return;
                }
            };
        })(),
    };

    componentDidMount() {
        const { scrollback, tabStopWidth } = this.props;
        this.term = new Terminal({ scrollback, tabStopWidth, cursorStyle: 'underline' });

        this.fitAddon = new FitAddon();

        this.term.loadAddon(this.fitAddon);
        this.term.prompt = () => {
            this.term.write('\r\n');
            //this.term.write(color.white(this.prompt));
        };

        const el = ReactDOM.findDOMNode(this.terminalContainer);

        this.term.open(el);
        this.term.focus(false);

        this.term.setOption('fontFamily', 'Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif');
        this.term.setOption('fontSize', 14);

        this.term.attachCustomKeyEventHandler(this.eventHandler.onKey);

        const xtermElement = el.querySelector('.xterm');
        xtermElement.style.paddingLeft = '3px';
        xtermElement.style.height = '100%';

        const viewportElement = el.querySelector('.xterm-viewport');
        this.verticalScrollbar = new PerfectScrollbar(viewportElement);

        window.addEventListener('resize', this.debounce(() => {
            if (this.props.active) {
                this.refitTerminal();
            }
        }, 150));
    }

    componentDidUpdate(_, prevState) {
        if (this.props.active) {
            setTimeout(() => {
                this.refitTerminal();
            }, 150);
        }

        if (this.state.terminalInputIndex !== prevState.terminalInputIndex) {
            const { terminalInputHistory } = this.state;

            if (terminalInputHistory.length === 0) {
                return;
            }

            // const inputSize = [...terminalInputHistory[this.state.terminalInputIndex] || ''].length;

            this.inputRef.current.focus();
            this.inputRef.current.value = terminalInputHistory[this.state.terminalInputIndex] || '';
        }
    }

    componentWillUnmount() {
        if (this.verticalScrollbar) {
            this.verticalScrollbar.destroy();
            this.verticalScrollbar = null;
        }
        if (this.term) {
            this.term.onKey(null);
            this.term = null;
            this.fitAddon = null;
        }

        window.removeEventListener('resize', this.debounce);
    }

    // http://www.alexandre-gomes.com/?p=115
    getScrollbarWidth() {
        const inner = document.createElement('p');
        inner.style.width = '100%';
        inner.style.height = '200px';

        const outer = document.createElement('div');
        outer.style.position = 'absolute';
        outer.style.top = '0px';
        outer.style.left = '0px';
        outer.style.visibility = 'hidden';
        outer.style.width = '200px';
        outer.style.height = '150px';
        outer.style.overflow = 'hidden';
        outer.appendChild(inner);

        document.body.appendChild(outer);
        const w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        const w2 = (w1 === inner.offsetWidth) ? outer.clientWidth : inner.offsetWidth;
        document.body.removeChild(outer);

        return (w1 - w2);
    }

    refitTerminal() {
        if (this.fitAddon) {
            this.fitAddon.fit();
        }
    }

    clear() {
        this.term.clear();
    }

    selectAll() {
        this.term.selectAll();
    }

    clearSelection() {
        this.term.clearSelection();
    }

    write(data) {
        this.term.write(data);
    }

    writeln(data) {
        this.term.write('\r');
        if (data.includes('error:')) {
            this.term.write(color.xterm(RED)(data));
        } else if (data.includes('ALARM:')) {
            this.term.write(color.xterm(ALARM_RED)(data));
        } else {
            this.term.write(data);
        }
        this.term.prompt();
    }

    handleCommandExecute = () => {
        const command = this.inputRef.current.value;

        if (!command) {
            return;
        }

        controller.writeln(command);

        const { terminalInputHistory = [] } = this.state;

        const newTerminalInputHistory = [...terminalInputHistory];

        if (terminalInputHistory.length === MAX_TERMINAL_INPUT_ARRAY_SIZE) {
            newTerminalInputHistory.shift();
        }

        store.replace('workspace.terminal.inputHistory', [...newTerminalInputHistory, command]);

        this.setState({ terminalInputHistory: [...newTerminalInputHistory, command], terminalInputIndex: newTerminalInputHistory.length + 1 });

        this.inputRef.current.value = '';
    }

    handleCopyLines = async () => {
        this.term.selectAll();
        const selection = this.term.getSelection().split('\n');
        this.term.clearSelection();
        await navigator.clipboard.writeText(selection.slice(-LINES_TO_COPY).join('\n'));

        Toaster.pop({
            msg: `Copied Last ${selection.length} Lines from the Terminal to Clipboard`,
            type: TOASTER_INFO
        });
    }

    updateInputHistoryIndex = (index) => {
        const { terminalInputHistory } = this.state;
        if (index < 0) {
            return;
        }

        if (index >= terminalInputHistory.length) {
            this.setState(current => ({ terminalInputIndex: current.terminalInputHistory.length }));
            this.inputRef.current.value = '';
            return;
        }

        this.setState({ terminalInputIndex: index });
    }

    resetTerminalInputIndex = () => {
        this.setState(current => ({ terminalInputIndex: current.terminalInputHistory.length }));
        this.inputRef.current.value = '';
    }

    render() {
        const { className, style } = this.props;
        const { terminalInputIndex } = this.state;

        return (
            <div style={{ display: 'grid', width: '100%', gridTemplateRows: '11fr 1fr' }}>
                <div
                    ref={node => {
                        this.terminalContainer = node;
                    }}
                    className={cx(className, styles.terminalContainer)}
                    style={style}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 18fr 3fr 5fr', alignItems: 'center', textAlign: 'center' }}>
                    <span style={{ opacity: '0.6' }}>&gt;</span>
                    <input
                        onKeyDown={(e) => {
                            switch (e.key) {
                            case 'Backspace': {
                                const { value } = e.target;
                                //If there is only one character left and the user has pressed the backspace,
                                //this will mean the value is empty now
                                if (!value || [...value].length === 1) {
                                    this.resetTerminalInputIndex();
                                }
                                break;
                            }
                            case 'Enter': {
                                this.handleCommandExecute();
                                break;
                            }

                            case 'ArrowUp': {
                                this.updateInputHistoryIndex(terminalInputIndex - 1);
                                break;
                            }

                            case 'ArrowDown': {
                                this.updateInputHistoryIndex(terminalInputIndex + 1);
                                break;
                            }
                            default: {
                                break;
                            }
                            }
                        }}
                        onChange={(e) => {
                            if (!e.target.value) {
                                this.resetTerminalInputIndex();
                            }
                        }}
                        type="text"
                        ref={this.inputRef}
                        style={{
                            border: 'none',
                            background: '#e5e7eb',
                            outline: 'none',
                        }}
                        placeholder="Enter G-Code Here..."
                    />

                    <TooltipCustom content={`Copy the last ${LINES_TO_COPY} lines from the terminal`} location="top" wrapperStyle={{ height: '100%' }}>
                        <Button
                            onClick={this.handleCopyLines}
                            style={{
                                margin: '0px',
                                height: '100%',
                                border: 'none',
                                borderRadius: '0px',
                                borderLeft: '1px solid #9ca3af'
                            }}
                        >
                            <i className="fas fa-copy" />
                        </Button>
                    </TooltipCustom>
                    <Button
                        onClick={this.handleCommandExecute}
                        primary
                        style={{
                            margin: '0px',
                            height: '100%',
                            border: 'none',
                            borderRadius: '0px',
                        }}
                    >
                        Run
                    </Button>
                </div>
            </div>
        );
    }
}

export default TerminalWrapper;
