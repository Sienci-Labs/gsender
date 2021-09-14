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
import color from 'cli-color';
import trimEnd from 'lodash/trimEnd';
import PerfectScrollbar from 'perfect-scrollbar';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { debounce } from 'lodash';
import store from 'app/store';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import Button from 'app/components/FunctionButton/FunctionButton';
import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import History from './History';
import styles from './index.styl';


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
        onResize: () => {
            const { rows, cols } = this.term;
            log.debug(`Resizing the terminal to ${rows} rows and ${cols} cols`);

            if (this.verticalScrollbar) {
                this.verticalScrollbar.update();
            }
        },
        onKey: (() => {
            let historyCommand = '';

            return (key, event) => {
                const { onData } = this.props;
                const term = this.term;
                const line = term.buffer.lines.get(term.buffer.ybase + term.buffer.y);
                const nonPrintableKey = (event.altKey || event.altGraphKey || event.ctrlKey || event.metaKey);

                if (!line) {
                    return;
                }

                // Ctrl-C copy - ctrl + c on windows/linux, meta-c on mac
                if ((event.ctrlKey || event.metaKey) && (event.code === 'KeyC')) {
                    document.execCommand('copy');
                    return;
                }
                // Ctrl-V paste
                if (event.ctrlKey && event.code === 'KeyV') {
                    term.paste();
                    return;
                }

                // Home
                if (event.key === 'Home' || (event.metaKey && event.key === 'ArrowLeft')) {
                    term.buffer.x = this.prompt.length;
                    return;
                }

                // End
                if (event.key === 'End' || (event.metaKey && event.key === 'ArrowRight')) {
                    let x = line.length - 1;
                    for (; x > this.prompt.length; --x) {
                        const c = line[x][1].trim();
                        if (c) {
                            break;
                        }
                    }

                    if ((x + 1) < (line.length - 1)) {
                        term.buffer.x = (x + 1);
                    }

                    return;
                }

                // Enter
                if (event.key === 'Enter') {
                    let buffer = '';
                    for (let x = this.prompt.length; x < line.length; ++x) {
                        const c = line[x][1] || '';
                        buffer += c;
                    }
                    buffer = trimEnd(buffer);

                    if (buffer.length > 0) {
                        // Clear history command
                        historyCommand = '';

                        // Reset the index to the last position of the history array
                        this.history.resetIndex();

                        // Push the buffer to the history list, not including the [Enter] key
                        this.history.push(buffer);
                    }

                    buffer += key;

                    log.debug('xterm>', buffer);

                    onData(buffer);
                    term.prompt();
                    return;
                }

                // Backspace
                if (event.key === 'Backspace') {
                    // Do not delete the prompt
                    if (term.buffer.x <= this.prompt.length) {
                        return;
                    }

                    for (let x = term.buffer.x; x < line.length; ++x) {
                        line[x - 1] = line[x];
                    }
                    line[line.length - 1] = [term.eraseAttr(), ' ', 1];
                    term.updateRange(term.buffer.y);
                    term.refresh(term.buffer.y, term.buffer.y);
                    term.write('\b');

                    return;
                }

                // Delete
                if (event.key === 'Delete') {
                    for (let x = term.buffer.x + 1; x < line.length; ++x) {
                        line[x - 1] = line[x];
                    }
                    line[line.length - 1] = [term.eraseAttr(), ' ', 1, 32];
                    term.updateRange(term.buffer.y);
                    term.refresh(term.buffer.y, term.buffer.y);

                    return;
                }

                // Escape
                if (event.key === 'Escape') {
                    term.eraseLine(term.buffer.y);
                    term.buffer.x = 0;
                    term.write(color.white(this.prompt));
                    return;
                }

                // ArrowLeft
                if (event.key === 'ArrowLeft') {
                    if (term.buffer.x <= this.prompt.length) {
                        return;
                    }
                    term.buffer.x--;
                    return;
                }

                // ArrowRight
                if (event.key === 'ArrowRight') {
                    let x = line.length - 1;
                    for (; x > 0; --x) {
                        const c = line[x][1].trim();
                        if (c) {
                            break;
                        }
                    }
                    if (term.buffer.x <= x) {
                        term.buffer.x++;
                    }

                    return;
                }

                // ArrowUp
                if (event.key === 'ArrowUp') {
                    if (!historyCommand) {
                        historyCommand = this.history.current() || '';
                    } else if (this.history.index > 0) {
                        historyCommand = this.history.back() || '';
                    }
                    term.eraseLine(term.buffer.y);
                    term.buffer.x = 0;
                    term.write(color.white(this.prompt));
                    term.write(color.white(historyCommand));
                    return;
                }

                // ArrowDown
                if (event.key === 'ArrowDown') {
                    historyCommand = this.history.forward() || '';
                    term.eraseLine(term.buffer.y);
                    term.buffer.x = 0;
                    term.write(color.white(this.prompt));
                    term.write(color.white(historyCommand));
                    return;
                }

                // PageUp
                if (event.key === 'PageUp') {
                    // Unsupported
                    return;
                }

                // PageDown
                if (event.key === 'PageDown') {
                    // Unsupported
                    return;
                }

                // Non-printable keys (e.g. ctrl-x)
                if (nonPrintableKey) {
                    onData(key);
                    return;
                }

                // Make sure the cursor position will not exceed the number of columns
                if (term.buffer.x < term.cols) {
                    let x = line.length - 1;
                    for (; x > term.buffer.x; --x) {
                        line[x] = line[x - 1];
                    }
                    term.write(color.white(key));
                }
            };
        })(),
        onPaste: (data, event) => {
            const { onData } = this.props;
            const lines = String(data).replace(/(\r\n|\r|\n)/g, '\n').split('\n');
            for (let i = 0; i < lines.length; ++i) {
                const line = lines[i];
                onData(line);
                this.term.write(color.white(line));
                this.term.prompt();
            }
        }
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

        const xtermElement = el.querySelector('.xterm');
        xtermElement.style.paddingLeft = '3px';

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
        this.term.write(data);
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 18fr 5fr', alignItems: 'center', textAlign: 'center' }}>
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
