// import ensureArray from 'ensure-array';
// import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import './styles.css';


class Spindle extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        clicked: PropTypes.bool
    };

    render() {
        const { state, actions } = this.props;
        const { canClick, spindleSpeed } = state;
        // const spindle = get(state, 'controller.modal.spindle');
        return (
            <div>
                <div className="form-group">
                    <div className="row no-gutters">
                        <div className="col-xs-14" style={{ marginLeft: 10, marginBottom: 10 }}>
                            <label className="control-label">{i18n._('Spindle')}</label>
                            <div className="btn-group btn-group-justified" role="group">
                                <div className="btn-group btn-group-lr" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={() => {
                                            if (spindleSpeed > 0) {
                                                controller.command('gcode', 'M3 S' + spindleSpeed);
                                            } else {
                                                controller.command('gcode', 'M3');
                                            }
                                        }}
                                        title={i18n._('Spindle On, CW (M3)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <i
                                            className="fas fa-forward"
                                        />
                                        <Space width="4" />
                                        M3
                                    </button>
                                </div>
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={() => {
                                            if (spindleSpeed > 0) {
                                                controller.command('gcode', 'M4 S' + spindleSpeed);
                                            } else {
                                                controller.command('gcode', 'M4');
                                            }
                                        }}
                                        title={i18n._('Spindle On, CCW (M4)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <i
                                            className="fas fa-forward fa-flip-horizontal"
                                        />
                                        <Space width="4" />
                                        M4
                                    </button>
                                </div>
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={() => controller.command('gcode', 'M5')}
                                        title={i18n._('Spindle Off (M5)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <i className="fa fa-power-off" />
                                        <Space width="4" />
                                        M5
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row no-gutters">
                        <div className="col-xs-14" style={{ marginLeft: 10, marginBottom: 10 }}>
                            <label className="control-label">{i18n._('Coolant')}</label>
                            <div className="btn-group btn-group-justified" role="group">
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={() => {
                                            controller.command('gcode', 'M7');
                                        }}
                                        title={i18n._('Mist Coolant On (M7)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <i className="fas fa-shower" />
                                        <Space width="4" />
                                        M7
                                    </button>
                                </div>
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={() => {
                                            controller.command('gcode', 'M8');
                                        }}
                                        title={i18n._('Flood Coolant On (M8)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <i className="fas fa-water" />
                                        <Space width="4" />
                                        M8
                                    </button>
                                </div>
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="coolantButtons"
                                        style={{ padding: '5px 0' }}
                                        onClick={controller.command('gcode', 'M9')}
                                        title={i18n._('Coolant Off (M9)', { ns: 'gcode' })}
                                        disabled={!canClick}
                                    >
                                        <ic
                                            className="fa fa-power-off fa-flip-horizontal"
                                        />
                                        <Space width="4" />
                                        M9
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <div className="row no-gutters">
                        <div className="col-xs-10" style={{ marginLeft: 37 }}>
                            <label className="control-label">{i18n._('Spindle Speed')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={spindleSpeed}
                                    placeholder="0"
                                    min={0}
                                    step={1}
                                    onChange={actions.handleSpindleSpeedChange}
                                    disabled={!canClick}
                                />
                                <span className="input-group-addon">{i18n._('RPM')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Spindle;
