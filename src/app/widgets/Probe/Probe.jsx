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
import Slider from 'rc-slider';

// import ToggleSwitch from 'app/components/ToggleSwitch';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import './style.css';

import {
    MODAL_PREVIEW
} from './constants';
import ProbeImage from './ProbeImage';
import ProbeDiameter from './ProbeDiameter';
import styles from './index.styl';


class Probe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        probeActive: PropTypes.bool
    };

    render() {
        const { state, actions } = this.props;
        const {
            canClick,
            availableProbeCommands,
            selectedProbeCommand,
            // useSafeProbeOption,
        } = state;
        const probeCommand = availableProbeCommands[selectedProbeCommand] || false;

        const marks = {
            ...availableProbeCommands.map((command, index) => (index === selectedProbeCommand
                ? <strong style={{ fontSize: '16px' }}>{command.id.split(' ')[0]}</strong>
                : <span>{command.id.split(' ')[0]}</span>))
        };

        return (
            <div className={styles.mainWrapper}>
                <div className={styles.mainGrid}>
                    <div className={styles.mainGridItem}>
                        <label>Axis</label>

                        <div className={styles.sliderWrapper}>
                            <Slider
                                min={0}
                                max={availableProbeCommands.length - 1}
                                value={selectedProbeCommand}
                                included={false}
                                marks={marks}
                                step={null}
                                onChange={actions.handleProbeCommandChange}
                                activeDotStyle={{ display: 'none' }}
                                handleStyle={{
                                    width: '0px',
                                    height: '0px',
                                    borderTop: '12px solid #3e85c7',
                                    borderBottom: 'none',
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    background: 'transparent',
                                    borderRadius: 0,
                                    outline: 'none',
                                    boxShadow: 'none',
                                    marginLeft: '-8px',
                                    marginTop: '-3px'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.mainGridItem}>
                        {/* {
                            probeCommand && probeCommand.safe && (
                                <div className="form-group hidden">
                                    <div className={styles.rowSpread}>
                                        <label htmlFor="exampleInputEmail2">Use Safe Probe:</label>
                                        <ToggleSwitch checked={useSafeProbeOption} onChange={actions.handleSafeProbeToggle} />
                                    </div>
                                    <span id="helpBlock" className="help-block">Safe probe probes from the top and right to avoid breaking bits.</span>
                                </div>
                            )
                        } */}
                        <label>Tools</label>
                        <div className={styles.toolsWrapper}>
                            <ProbeDiameter actions={actions} state={state} probeCommand={probeCommand} />
                            <FunctionButton
                                onClick={() => actions.openModal(MODAL_PREVIEW)}
                                disabled={!canClick}
                                className={styles.probeButton}
                            >
                                Probe
                            </FunctionButton>
                        </div>
                    </div>
                </div>
                <ProbeImage probeCommand={probeCommand} />
            </div>
        );
    }
}

export default Probe;
