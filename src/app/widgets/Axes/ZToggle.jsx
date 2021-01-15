/* eslint-disable linebreak-style */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import * as Constants from '../../constants';

import './styles.css';

class ZToggle extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            zStepValue: props.zDistance,
            canClickXY: props.canClickXY
        };
    }

    static propTypes = {
        props: PropTypes.bool,
        canClick: PropTypes.bool,
        axes: PropTypes.array,
        zDistance: PropTypes.number,
        metricMaxDistance: PropTypes.number,
        units: PropTypes.number,
        handleZToggle: PropTypes.func,
        zStepValue: PropTypes.number,
        canClickXY: PropTypes.bool
    }

    getStepDistanceZ(step) {
        if (this.props.units === Constants.METRIC_UNITS) {
            if (step >= 100) {
                this.setState({ lastZStep: 100 });
                return 100;
            } else if (step >= 10) {
                this.setState({ lastZStep: 100 });
                return 10;
            } else if (step > 1) {
                this.setState({ lastZStep: 1 });
                return 1;
            }
            this.setState({ lastZStep: 0.1 });
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
            <div disabled={this.state.canClickXY}>
                <div className="rollingZMove">
                    <label
                        className="htmlLabels"
                        htmlFor="secondToggleNumber"
                    >
                        Z Move
                    </label>
                    <input
                        onChange={this.props.handleZToggle}
                        className="rollingZInput"
                        type="number"
                        name="zMove"
                        min="1"
                        max="10"
                        step={this.getStepDistanceZ(this.props.zDistance)}
                        value={this.props.zDistance}
                    />
                </div>
            </div>
        );
    }
}

export default ZToggle;
