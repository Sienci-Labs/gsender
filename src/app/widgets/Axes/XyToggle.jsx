/* eslint-disable linebreak-style */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import * as Constants from '../../constants';

import './styles.css';

class XyToggle extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            xyStepValue: props.xyDistance
        };
    }

    static propTypes = {
        props: PropTypes.bool,
        canClick: PropTypes.bool,
        axes: PropTypes.array,
        xyDistance: PropTypes.number,
        metricMaxDistance: PropTypes.number,
        units: PropTypes.number,
        handleXYMove: PropTypes.func,
        xyStepValue: PropTypes.number
    }

    getStepDistanceXY(step) {
        if (this.props.units === Constants.METRIC_UNITS) {
            if (step >= 100) {
                this.setState({ lastXYStep: 100 });
                return 100;
            } else if (step >= 10) {
                this.setState({ lastXYStep: 100 });
                return 10;
            } else if (step > 1) {
                this.setState({ lastXYStep: 1 });
                return 1;
            }
            this.setState({ lastXYStep: 0.1 });
            return 0.1;
        } else {
            //Todo: Steps for Imperial--These are metric repeated
            if (step >= 1000) {
                return 1000;
            } else if (step >= 100) {
                return 100;
            } else if (step >= 10) {
                return 10;
            } else if (step > 1) {
                return 1;
            }
            return 0.1;
        }
    }

    render() {
        return (
            <div>
                <div className="rollingXYMove">
                    <label
                        className="htmlLabels"
                        htmlFor="firstToggleNumber"
                    >XY Move
                    </label>
                    <input
                        onChange={this.props.handleXYMove}
                        type="number"
                        className="rollingXYInput"
                        name="xyMove"
                        max={this.props.metricMaxDistance}
                        min="0"
                        step={this.getStepDistanceXY(this.props.xyDistance)}
                        value={this.props.xyDistance}
                    />
                </div>
            </div>
        );
    }
}

export default XyToggle;
