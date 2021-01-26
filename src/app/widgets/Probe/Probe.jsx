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

class Probe extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    render() {
        const { state, actions } = this.props;
        const {
            canClick,
            availableTouchplates,
            selectedTouchplate,
            units,
            availableTools,
            availableProbeCommands,
            selectedProbeCommand,
            useSafeProbeOption
        } = state;
        const displayUnits = (units === METRIC_UNITS) ? i18n._('mm') : i18n._('in');

        const touchplateProfile = availableTouchplates[selectedTouchplate];
        const { functions } = touchplateProfile;
        const probeCommand = availableProbeCommands[selectedProbeCommand];
        console.log(probeCommand);

        return (
            <div className={styles.probeFlex}>
                <div className={styles.probeOptionsCol}>
                    <div className="form-group">
                        <label className="control-label">{i18n._('Touchplate Profile')}</label>
                        <select onChange={actions.handleTouchplateSelection} className="form-control">
                            {
                                availableTouchplates.map((touchplate, index) => (
                                    <option
                                        value={index}
                                        key={`option-${index}`}
                                    >
                                        {touchplate.id}
                                    </option>))
                            }
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="control-label">{i18n._('Probe Commands')}</label>
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
                        probeCommand.safe &&
                        <div className="form-group">
                            <div className={styles.rowSpread}>
                                <label htmlFor="exampleInputEmail2">Use Safe Probe:</label>
                                <ToggleSwitch checked={useSafeProbeOption} />
                            </div>
                            <span id="helpBlock" className="help-block">Safe probe probes from the top and right to avoid breaking bits.</span>
                        </div>
                    }
                    {
                        probeCommand.tool &&
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
                            <button
                                type="button"
                                className="btn btn-sm btn-default"
                                onClick={() => {
                                    actions.openModal(MODAL_PREVIEW);
                                }}
                                disabled={!canClick}
                            >
                                {i18n._('Probe')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className={styles.probeSettingsCol}>
                    <h5>{touchplateProfile.id}</h5>
                    {
                        (functions.x && functions.y) &&
                            <div>
                                <h6>XY Thickness:</h6>
                                <div className="small">{touchplateProfile.xyThickness}{displayUnits}</div>
                            </div>
                    }
                    {
                        functions.z &&
                            <div>
                                <h6>Z Thickness:</h6>
                                <div className="small">{touchplateProfile.zThickness}{displayUnits}</div>
                            </div>
                    }
                </div>
            </div>
        );
    }
}

export default Probe;
