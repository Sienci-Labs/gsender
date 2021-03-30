import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import ToggleSwitch from 'app/components/ToggleSwitch';
import {
    MODAL_PREVIEW
} from './constants';
import {
    METRIC_UNITS
} from '../../constants';
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
            units,
            availableTools,
            availableProbeCommands,
            selectedProbeCommand,
            useSafeProbeOption,
        } = state;
        const displayUnits = (units === METRIC_UNITS) ? i18n._('mm') : i18n._('in');
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
                    <ProbeDiameter actions={actions} state={state} />
                    {
                        probeCommand && probeCommand.tool &&
                        <div className="form-group">
                            <label className="control-label">{i18n._('Tool Profile')}</label>
                            <select className="form-control">
                                {
                                    availableTools.map((tool, index) => (
                                        <option
                                            value={index}
                                            key={`tool-${index}`}
                                        >
                                            {`${units === METRIC_UNITS ? tool.metricDiameter : tool.imperialDiameter}${displayUnits} ${tool.type}`}
                                        </option>))
                                }
                            </select>
                        </div>
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
