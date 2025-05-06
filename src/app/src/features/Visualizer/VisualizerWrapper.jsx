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

import React, { Component } from 'react';
import pubsub from 'pubsub-js';
import { shouldVisualizeSVG } from '../../workers/Visualize.response';
import SVGVisualizer from './SVGVisualizer';
import Visualizer from './Visualizer';

class VisualizerWrapper extends Component {
    constructor(props) {
        super(props);
        this.state = {
            needRefresh: false,
            needReload: false,
        };
    }

    pubsubTokens = [];

    visualizer = null;

    componentDidMount() {
        this.subscribe();
    }

    componentDidUpdate() {
        // force refresh, changing which visualizer component is being used
        if (this.state.needRefresh) {
            this.visualizer.reloadGCode();
            this.setNeedRefresh(false);
            // a step further than refresh, reparsing the gcode as well
        } else if (this.state.needReload) {
            this.visualizer.reparseGCode();
            this.setNeedReload(false);
        }
    }

    setNeedRefresh(state) {
        this.setState(() => {
            return {
                needRefresh: state,
            };
        });
    }

    setNeedReload(state) {
        this.setState(() => {
            return {
                needReload: state,
            };
        });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('litemode:change', (msg, isFileLoaded) => {
                if (isFileLoaded) {
                    this.setNeedRefresh(true);
                    this.forceUpdate()
                } else {
                    this.forceUpdate();
                }
            }),
            // currently, changing the settings requires reparsing of the gcode
            pubsub.subscribe('visualizer:settings', () => {
                this.setNeedReload(true);
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

    render() {
        const {
            state,
            show,
            cameraPosition,
            actions,
            containerID,
            isSecondary,
        } = this.props;
        let renderSVG = shouldVisualizeSVG();
        return (
            <>
                {!renderSVG && (
                    <Visualizer
                        show={show}
                        cameraPosition={cameraPosition}
                        ref={(visualizerRef) => {
                            this.visualizer = visualizerRef;
                        }}
                        state={state}
                        actions={actions}
                        containerID={containerID}
                        isSecondary={isSecondary}
                    />
                )}
                {renderSVG && (
                    <SVGVisualizer
                        show={show}
                        ref={(visualizerRef) => {
                            this.visualizer = visualizerRef;
                        }}
                        state={state}
                        actions={actions}
                        containerID={containerID}
                        isSecondary={isSecondary}
                    />
                )}
            </>
        );
    }
}

export default VisualizerWrapper;
