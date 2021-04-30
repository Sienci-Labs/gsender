/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import ToggleSwitch from 'app/components/ToggleSwitch';
import {
    MODAL_PREVIEW
} from './constants';
import styles from './index.styl';
import ProbeImage from './ProbeImage';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import ProbeDiameter from './ProbeDiameter';

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
            useSafeProbeOption,
        } = state;
        const probeCommand = availableProbeCommands[selectedProbeCommand] || false;

        return (
            <div className={styles.probeFlex}>
                <div className={styles.probeOptionsCol}>
                    <div className="form-group">
                        <label className="control-label">
                            {i18n._('Probe')}
                        </label>
                        <select className="form-control" onChange={actions.handleProbeCommandChange}>
                            {
                                availableProbeCommands.map((command, index) => (
                                    <option
                                        value={index}
                                        key={`command-${index}`}
                                    >
                                        {command.id}
                                    </option>))
                            }
                        </select>
                    </div>
                    {
                        probeCommand && probeCommand.safe &&
                        <div className="form-group hidden">
                            <div className={styles.rowSpread}>
                                <label htmlFor="exampleInputEmail2">Use Safe Probe:</label>
                                <ToggleSwitch checked={useSafeProbeOption} onChange={actions.handleSafeProbeToggle}/>
                            </div>
                            <span id="helpBlock" className="help-block">Safe probe probes from the top and right to avoid breaking bits.</span>
                        </div>
                    }

                    {
                        probeCommand && probeCommand.tool &&
                        <ProbeDiameter actions={actions} state={state} />
                    }
                    <div className="row no-gutters">
                    </div>
                    <div className="row no-gutters">
                        <div className="col-xs-12">
                            <FunctionButton
                                onClick={() => {
                                    actions.openModal(MODAL_PREVIEW);
                                }}
                                disabled={!canClick}
                            >
                                Probe
                            </FunctionButton>
                        </div>
                    </div>
                </div>
                <div className={styles.probeSettingsCol}>
                    <ProbeImage probeCommand={probeCommand} />
                </div>
            </div>
        );
    }
}

export default Probe;
