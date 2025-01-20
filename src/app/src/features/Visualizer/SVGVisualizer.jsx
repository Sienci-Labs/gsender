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

import { store as reduxStore } from 'app/store/redux';
import api from 'app/api';
import { connect } from 'react-redux';
import _get from 'lodash/get';
import store from 'app/store';
import pubsub from 'pubsub-js';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    RENDER_RENDERED,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import controller from '../../lib/controller';
import { BACKGROUND_PART, G0_PART, G1_PART } from './constants';
import { updateFileRenderState } from 'app/store/redux/slices/fileInfo.slice';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';

class SVGVisualizer extends Component {
    static propTypes = {
        show: PropTypes.bool,
        state: PropTypes.object,
        isSecondary: PropTypes.bool,
    };

    pubsubTokens = [];

    isSecondaryVisualizer = this.props.isSecondary;

    bbox = {
        max: {
            x: 0,
            y: 0,
            z: 0,
        },
        min: {
            x: 0,
            y: 0,
            z: 0,
        },
    };

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

        if (
            xMax0 !== xMax1 ||
            yMax0 !== yMax1 ||
            zMax0 !== zMax1 ||
            xMin0 !== xMin1 ||
            yMin0 !== yMin1 ||
            zMin0 !== zMin1
        ) {
            this.bbox = bbox;
            this.updateSVG();
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('file:load', (msg, data) => {
                const { isSecondary, activeVisualizer } = this.props;

                const isPrimaryVisualizer =
                    !isSecondary && activeVisualizer === VISUALIZER_PRIMARY;
                const isSecondaryVisualizer =
                    isSecondary && activeVisualizer === VISUALIZER_SECONDARY;

                if (isPrimaryVisualizer) {
                    this.isSecondaryVisualizer = false;
                    this.load('', data);
                    return;
                }

                if (isSecondaryVisualizer) {
                    this.isSecondaryVisualizer = true;
                    this.load('', data);
                    return;
                }
            }),
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    reparseGCode() {
        const { state } = this.props;
        const { gcode } = state;
        // reparse file
        pubsub.publish('reparseGCode', {
            content: gcode.content,
            size: gcode.size,
            name: gcode.name,
            visualizer: this.props.isSecondary
                ? VISUALIZER_SECONDARY
                : VISUALIZER_PRIMARY,
        });
    }

    reloadGCode() {
        const { actions, state } = this.props;
        const { gcode } = state;
        actions.loadGCode('', gcode.visualization);
    }

    async uploadGCodeFile(gcode) {
        const serializedFile = new File([gcode], 'surfacing.gcode');
        await uploadGcodeFileToServer(
            serializedFile,
            controller.port,
            VISUALIZER_SECONDARY,
        );
    }

    updateSVG() {
        let group = document.getElementById(
            !this.isSecondaryVisualizer ? 'g' : 'g2',
        );
        let svg = document.getElementById(
            !this.isSecondaryVisualizer ? 'svg' : 'svg2',
        );
        if (group && svg) {
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

            // represents the unit length of the svg in each dimension
            let xLength = bbox.delta.x;
            let yLength = bbox.delta.y;

            // calculation for the middle of the svg
            let xMiddle = (bbox.min.x + bbox.max.x) / 2;
            let yMiddle = (bbox.min.y + bbox.max.y) / 2;

            /*
                i'm setting the viewbox coordinates so the svg is alrdy in the middle.
                the first x and y values you give it represent the top left corner of the viewbox.
                therefore, the top left corner when the svg is in the middle should be:
                    - x: the middle of the svg - half the width of the viewbox
                    - y: the middle of the svg + half the width of the viewbox
            */
            const xZero =
                xMiddle - (Math.abs(xLength) + Math.abs(xLength) / 2) / 2;
            const yZero =
                (yMiddle + (Math.abs(yLength) + Math.abs(yLength) / 2) / 2) *
                -1; // y is inversed because the svg starts off upside down

            // set the top left corner of the viewbox as the coordinates we calculated,
            // and set its size as the svg size plus a little extra
            svg.setAttribute(
                'viewBox',
                xZero +
                    ' ' +
                    yZero +
                    ' ' +
                    (Math.abs(xLength) + Math.abs(xLength) / 2) +
                    ' ' +
                    (Math.abs(yLength) + Math.abs(yLength) / 2),
            );
            group.setAttribute('transform', 'translate(0,0) scale(1,-1)');
        }
    }

    handleSceneRender(vizualization) {
        const { paths } = vizualization;
        const { currentTheme } = this.props.state;

        let svg = document.getElementById(
            !this.isSecondaryVisualizer ? 'svg' : 'svg2',
        );
        if (svg) {
            const group = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g',
            );
            group.setAttribute('id', !this.isSecondaryVisualizer ? 'g' : 'g2');
            paths.map((element, i) => {
                const node = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'path',
                );
                const path = element.path;
                const fill = element.fill;

                node.setAttribute('d', path);
                node.setAttribute('fill', fill);
                // add stroke colour
                const motion = element.motion;
                const opacity = motion === 'G0' ? '0F' : 'FF';
                const stroke =
                    motion === 'G0'
                        ? currentTheme.get(G0_PART) + opacity
                        : currentTheme.get(G1_PART) + opacity;
                node.setAttribute('stroke', stroke);

                return group.appendChild(node);
            });

            svg.appendChild(group);

            this.updateSVG();

            reduxStore.dispatch(updateFileRenderState(RENDER_RENDERED));
        }
    }

    // name parameter is included to match the normal visualizer load function
    // DO NOT remove it or you'll get errors
    load(name, vizualization) {
        this.unload();
        this.handleSceneRender(vizualization);
    }

    unload() {
        let svg = document.getElementById(
            !this.isSecondaryVisualizer ? 'svg' : 'svg2',
        );
        // remove svg
        if (svg) {
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }
        }
    }

    render() {
        const id = !this.isSecondaryVisualizer ? 'svg' : 'svg2';
        const viewBox = !this.isSecondaryVisualizer
            ? '0 0 500 500'
            : '0 0 470 470';
        const { currentTheme } = this.props.state;
        return (
            <div
                style={{
                    visibility: this.props.show ? 'visible' : 'hidden',
                }}
            >
                <svg
                    id={id}
                    height="100%"
                    width="100%"
                    viewBox={viewBox}
                    style={{
                        backgroundColor: currentTheme.get(BACKGROUND_PART),
                    }}
                />
            </div>
        );
    }
}

SVGVisualizer.defaultProps = {
    isSecondary: false,
};

export default connect(
    (store) => {
        const bbox = _get(store, 'file.bbox');
        const content = _get(store, 'file.content');
        const { activeVisualizer } = store.visualizer;
        return {
            bbox,
            content,
            activeVisualizer,
        };
    },
    null,
    null,
    { forwardRef: true },
)(SVGVisualizer);
