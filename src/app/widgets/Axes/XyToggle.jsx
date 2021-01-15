/* eslint-disable linebreak-style */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import NumericInput from 'react-numeric-input';
import incrimentStyles from './incrimentStyles';
import * as Constants from '../../constants';


import './styles.css';

class XyToggle extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            xyStepValue: props.xyDistance,
            canClickXY: props.canClickXY
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
        xyStepValue: PropTypes.number,
        canClickXY: PropTypes.bool
    }

    getStepDistanceXY(step) {
        if (this.props.units === Constants.METRIC_UNITS) {
            if (step >= 100 || step.valueOf(100)) {
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

    myFormat = (num) => {
        let amounts = [1, 2, 3, 4, 5];
        for (num = 0; num < amounts.length; num++) {
            return amounts[num];
        } return amounts[num];
    }

    render() {
        let style = incrimentStyles;
        return (
            <div className="rollingXYMove">
                <label
                    className="htmlLabels"
                    htmlFor="firstToggleNumber"
                >XY Move
                </label>
                <NumericInput
                    onChange={this.props.handleXYMove}
                    type="number"
                    style={style}
                    name="xyMove"
                    max={this.props.metricMaxDistance}
                    min="0"
                    format={this.myFormat}
                    value={this.props.xyDistance}

                />
            </div>
        );
    }
}

export default XyToggle;
