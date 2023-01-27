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
import cx from 'classnames';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import useKeybinding from '../../lib/useKeybinding';

import {
    MODAL_PREVIEW
} from './constants';
import { METRIC_UNITS, PROBING_CATEGORY } from '../../constants';
import ProbeImage from './ProbeImage';
import ProbeDiameter from './ProbeDiameter';
import styles from './index.styl';


class Probe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        probeActive: PropTypes.bool
    };

    shuttleControlEvents = {
        OPEN_PROBE: {
            id: 74,
            title: 'Open Probe',
            keys: '',
            cmd: 'OPEN_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                this.props.actions.openModal(MODAL_PREVIEW);
            },
        },
        PROBE_ROUTINE_SCROLL_RIGHT: {
            id: 75,
            title: 'Probe Routine Scroll Right',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_RIGHT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { state, actions } = this.props;
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand + 1;
                if (availableProbeCommands.length <= newIndex) {
                    newIndex = 0;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        PROBE_ROUTINE_SCROLL_LEFT: {
            id: 76,
            title: 'Probe Routine Scroll Left',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_LEFT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { state, actions } = this.props;
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand - 1;
                if (newIndex < 0) {
                    newIndex = availableProbeCommands.length - 1;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        PROBE_DIAMETER_SCROLL_UP: {
            id: 77,
            title: 'Probe Diameter Scroll Up',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_UP',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { state, actions } = this.props;
                const { toolDiameter, availableTools, units } = state;
                const toolUnits = units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
                const currIndex = availableTools.findIndex(element => element[toolUnits] === toolDiameter);

                let newIndex = currIndex - 1;
                if (newIndex < 0) {
                    newIndex = availableTools.length - 1;
                }
                actions.setToolDiameter({ value: availableTools[newIndex][`${toolUnits}`] });
            },
        },
        PROBE_DIAMETER_SCROLL_DOWN: {
            id: 78,
            title: 'Probe Diameter Scroll Down',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_DOWN',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { state, actions } = this.props;
                const { toolDiameter, availableTools, units } = state;
                const toolUnits = units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
                const currIndex = availableTools.findIndex(element => element[toolUnits] === toolDiameter);

                let newIndex = currIndex + 1;
                if (newIndex >= availableTools.length) {
                    newIndex = 0;
                }
                actions.setToolDiameter({ value: availableTools[newIndex][`${toolUnits}`] });
            },
        }
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    componentDidMount() {
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);
        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.removeShuttleControlEvents();
    }

    render() {
        const { state, actions } = this.props;
        const {
            canClick,
            availableProbeCommands,
            selectedProbeCommand,
            touchplate
        } = state;

        const { touchplateType } = touchplate;
        const probeCommand = availableProbeCommands[selectedProbeCommand] || false;

        return (
            <div className={styles.mainWrapper}>
                <div className={styles.mainGrid}>
                    <div className={styles.secondaryFlexbox}>
                        <div className={styles.mainGridItem}>
                            <label style={{ margin: 0 }}>Axis</label>

                            <div className={styles.axisButtonsWrapper}>
                                {
                                    availableProbeCommands.map((command, index) => (
                                        <FunctionButton
                                            key={command.id}
                                            onClick={() => actions.handleProbeCommandChange(index)}
                                            className={index === selectedProbeCommand ? styles.axisButtonActive : styles.axisButton}
                                        >
                                            { index === selectedProbeCommand && (<div className={styles.axisButtonActiveIndicator} />) }
                                            {command.id.split(' ')[0]}
                                        </FunctionButton>
                                    ))
                                }
                            </div>
                        </div>
                        <div className={cx(styles.mainGridItem, { [styles.hidden]: !probeCommand.tool })}>
                            <label>Tool</label>
                            <div className={styles.toolsWrapper}>
                                <ProbeDiameter actions={actions} state={state} probeCommand={probeCommand} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.mainGridItem}>
                        <div />
                        <FunctionButton
                            onClick={() => actions.openModal(MODAL_PREVIEW)}
                            disabled={!canClick}
                            className={styles.probeButton}
                        >
                            Probe
                        </FunctionButton>
                    </div>
                </div>
                <ProbeImage touchplateType={touchplateType} probeCommand={probeCommand} />
            </div>
        );
    }
}

export default Probe;
