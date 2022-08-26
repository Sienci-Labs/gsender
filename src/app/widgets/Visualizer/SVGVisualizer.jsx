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

import reduxStore from 'app/store/redux';
import api from 'app/api';
import { connect } from 'react-redux';
import * as fileActions from 'app/actions/fileInfoActions';
import _get from 'lodash/get';
import store from 'app/store';
import pubsub from 'pubsub-js';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    RENDER_RENDERED,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY
} from 'app/constants';
import controller from '../../lib/controller';
import styles from './index.styl';

class SVGVisualizer extends Component {
    static propTypes = {
        show: PropTypes.bool,
        cameraPosition: PropTypes.oneOf(['top', '3d', 'front', 'left', 'right']),
        state: PropTypes.object,
        isSecondary: PropTypes.bool,
    };

    pubsubTokens = [];

    isSecondaryVisualizer = this.props.isSecondary;

    bbox = {
        max: {
            x: 0,
            y: 0,
            z: 0
        },
        min: {
            x: 0,
            y: 0,
            z: 0
        }
    }

    theme = store.get('widgets.visualizer');

    componentDidMount() {
        this.subscribe();
    }

    componentDidUpdate() {
        const { bbox } = this.props;

        const { max: max0, min: min0 } = this.bbox;
        const { x: xMax0, y: yMax0, z: zMax0 } = max0;
        const { x: xMin0, y: yMin0, z: zMin0 } = min0;

        const { max: max1, min: min1 } = bbox;
        const { x: xMax1, y: yMax1, z: zMax1 } = max1;
        const { x: xMin1, y: yMin1, z: zMin1 } = min1;

        if (xMax0 !== xMax1 || yMax0 !== yMax1 || zMax0 !== zMax1 ||
            xMin0 !== xMin1 || yMin0 !== yMin1 || zMin0 !== zMin1) {
            this.bbox = bbox;
            this.updateSVG();
        }
    }

    componentWillUnMount() {
        this.unsubscribe();
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('file:load', (msg, data) => {
                const { isSecondary, activeVisualizer } = this.props;

                const isPrimaryVisualizer = !isSecondary && activeVisualizer === VISUALIZER_PRIMARY;
                const isSecondaryVisualizer = isSecondary && activeVisualizer === VISUALIZER_SECONDARY;

                if (isPrimaryVisualizer) {
                    this.isSecondaryVisualizer = false;
                    this.load(data);
                    return;
                }

                if (isSecondaryVisualizer) {
                    this.isSecondaryVisualizer = true;
                    this.load(data);
                    return;
                }
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            this.pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    rerenderGCode() {
        const { state, content } = this.props;
        const { gcode } = state;

        if (gcode.content) {
            this.load(gcode.content);
        } else {
            // reupload the file to update the colours
            this.uploadGCodeFile(content);
        }
    }

    async uploadGCodeFile (gcode) {
        const serializedFile = new File([gcode], 'surfacing.gcode');
        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);
    }

    updateSVG() {
        let svg = document.getElementById(!this.isSecondaryVisualizer ? 'svg' : 'svg2');
        const reduxBBox = this.props.bbox;
        let bbox = JSON.parse(JSON.stringify(reduxBBox)); // make shallow copy
        // convert from inches to mm
        const { content } = this.props;
        if (content.includes('G20')) {
            bbox.max.x *= 25.4;
            bbox.max.y *= 25.4;
            bbox.min.x *= 25.4;
            bbox.min.y *= 25.4;
            bbox.delta.x *= 25.4;
            bbox.delta.y *= 25.4;
        }

        // we are flipping the y values so the image isnt upside down,
        // therefore the yMultiplier is * -1 what it normally would be
        let xMultiplier = 1;
        let yMultiplier = -1;
        let xVal = bbox.min.x;
        let yVal = bbox.min.y;
        // top right
        if (bbox.min.x >= 0 && bbox.min.y >= 0 && bbox.max.x > 0 && bbox.max.y > 0) {
            xMultiplier = 1;
            xVal = bbox.max.x;
            yMultiplier = -1;
            yVal = bbox.max.y;
        } else if (bbox.min.x < 0 && bbox.min.y >= 0 && bbox.max.x <= 0 && bbox.max.y > 0) {
            // top left
            xMultiplier = 1;
            xVal = bbox.min.x;
            yMultiplier = -1;
            yVal = bbox.max.y;
        } else if (bbox.min.x >= 0 && bbox.min.y < 0 && bbox.max.x > 0 && bbox.max.y <= 0) {
            // bottom right
            xMultiplier = 1;
            xVal = bbox.max.x;
            yMultiplier = -1;
            yVal = bbox.min.y;
        } else if (bbox.min.x < 0 && bbox.min.y < 0 && bbox.max.x <= 0 && bbox.max.y <= 0) {
            // bottom left
            xMultiplier = 1;
            xVal = bbox.min.x;
            yMultiplier = -1;
            yVal = bbox.min.y;
        } else if (bbox.min.x < 0 && bbox.min.y < 0 && bbox.max.x > 0 && bbox.max.y > 0) {
            // center
            xMultiplier = 1;
            xVal = 0;
            yMultiplier = -1;
            yVal = 0;
        }
        const middle = !this.isSecondaryVisualizer ? 250 : 235;
        const xtrans = middle - (xVal * xMultiplier / 2);
        const ytrans = middle - (yVal * yMultiplier / 2);

        // center the svg
        svg.setAttribute('transform', 'translate(' + xtrans + ',' + ytrans + ') scale(1,-1)');
    }

    handleSVGRender(vizualization) {
        const { vertices, colors } = vizualization;
        const { currentTheme } = this.props.state;
        const { G0Color, G1Color } = currentTheme;
        let svg = document.getElementById(!this.isSecondaryVisualizer ? 'svg' : 'svg2');
        if (svg) {
            vertices.map((vertice, i) => {
                const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                for (let prop in vertice.props) {
                    if (Object.prototype.hasOwnProperty.call(vertice.props, prop)) {
                        node.setAttribute(prop, vertice.props[prop]);
                    }
                }
                // add stroke colour
                const motion = colors[i][0];
                const opacity = colors[i][1];
                const stroke = motion === 'G0' ? G0Color + opacity : G1Color + opacity;
                node.setAttribute('stroke', stroke);

                return svg.appendChild(node);
            });

            this.updateSVG();
            reduxStore.dispatch({
                type: fileActions.UPDATE_FILE_RENDER_STATE,
                payload: {
                    state: RENDER_RENDERED
                }
            });
        }
    }

    load(vizualization) {
        this.unload();
        this.handleSVGRender(vizualization);
    }

    unload() {
        let svg = document.getElementById(!this.isSecondaryVisualizer ? 'svg' : 'svg2');
        // remove svg
        if (svg) {
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }
        }
    }

    render() {
        const id = !this.isSecondaryVisualizer ? 'svg' : 'svg2';
        const viewBox = !this.isSecondaryVisualizer ? '0 0 500 500' : '0 0 470 470';
        const { currentTheme } = this.props.state;
        const { backgroundColor } = currentTheme;
        return (
            <div
                style={{
                    visibility: this.props.show ? 'visible' : 'hidden'
                }}
                className={styles.visualizerContainer}
            >
                <svg
                    height="100%"
                    width="100%"
                    viewBox={viewBox}
                    className={styles.svgContainer}
                    style={{ backgroundColor: backgroundColor }}
                >
                    <g
                        id={id}
                    />
                </svg>
            </div>
        );
    }
}

SVGVisualizer.defaultProps = {
    isSecondary: false,
};

export default connect((store) => {
    const bbox = _get(store, 'file.bbox');
    const content = _get(store, 'file.content');
    const { activeVisualizer } = store.visualizer;
    return {
        bbox,
        content,
        activeVisualizer
    };
}, null, null, { forwardRef: true })(SVGVisualizer);
