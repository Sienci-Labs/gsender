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
import {
    shouldVisualize,
    shouldVisualizeSVG,
} from '../../workers/Visualize.response';
import SVGVisualizer from './SVGVisualizer';
import Visualizer from './Visualizer';
import { VisualizerPlaceholder } from 'app/features/Visualizer/Placeholder.jsx';

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

    threeVisualizer = null;

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    componentDidUpdate() {
        const inSVGMode = shouldVisualizeSVG();
        // shouldVisualize() returns true for SVG/Light mode too, so explicitly exclude it
        const inFullMode = shouldVisualize() && !inSVGMode;

        if (this.state.needRefresh) {
            if (inFullMode && this.threeVisualizer) {
                // Rebuild entire scene (lights, grids, tools, limits) then reload GCode.
                // Uses threeVisualizer directly because SVGVisualizer's unmount ref cleanup
                // fires after the 3D ref update, leaving this.visualizer null by now.
                this.threeVisualizer.rebuildSceneContents();
            } else if (inSVGMode && this.visualizer) {
                this.visualizer.reloadGCode();
            }
            this.setNeedRefresh(false);
        } else if (this.state.needReload) {
            if (inFullMode && this.threeVisualizer) {
                this.threeVisualizer.reparseGCode();
            } else if (this.visualizer) {
                this.visualizer.reparseGCode();
            }
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
            pubsub.subscribe('litemode:change', (msg, { isFileLoaded, enteringLiteMode, wasInEverythingMode }) => {
                if (enteringLiteMode && this.threeVisualizer) {
                    this.threeVisualizer.disposeGeometries();
                }
                if (!enteringLiteMode) {
                    // Always rebuild scene structure when exiting lite mode —
                    // disposeGeometries() orphaned this.group, stopped the animation loop,
                    // and cleared lights/grids. rebuildSceneContents() restores all of this.
                    this.setNeedRefresh(true);
                    if (isFileLoaded && wasInEverythingMode) {
                        // Geometry was never parsed in EVERYTHING mode.
                        // reparseGCode() runs after rebuildSceneContents() completes (next cycle).
                        this.setNeedReload(true);
                    }
                }
                this.forceUpdate();
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
        let renderAny = shouldVisualize() && !renderSVG;

        const show3D = isSecondary || renderAny;

        return (
            <>
                {/* Keep Visualizer always mounted to avoid WebGL renderer recreation on each toggle.
                    Hide with CSS when not active so the renderer instance is preserved. */}
                <div style={{ display: show3D ? '' : 'none' }} className="w-full h-full">
                    <Visualizer
                        show={show && show3D}
                        cameraPosition={cameraPosition}
                        ref={(visualizerRef) => {
                            this.threeVisualizer = visualizerRef;
                            this.visualizer = visualizerRef;
                        }}
                        state={state}
                        actions={actions}
                        containerID={containerID}
                        isSecondary={isSecondary}
                    />
                </div>
                {!isSecondary && renderSVG && (
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
                {!isSecondary && !renderSVG && !renderAny && (
                    <VisualizerPlaceholder />
                )}
            </>
        );
    }
}

export default VisualizerWrapper;
