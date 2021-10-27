// import React, { createRef, useState, useEffect, useMemo } from 'react';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import { inRange, throttle } from 'lodash';

import reduxStore from 'app/store/redux';
import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import store from 'app/store';
import controller from 'app/lib/controller';
import { METRIC_UNITS, IMPERIAL_UNITS, VISUALIZER_PRIMARY, VISUALIZER_SECONDARY } from 'app/constants';
import Visualizer from 'app/widgets/Visualizer';
import api from 'app/api';

import InputArea from './InputArea';
import ActionArea from './components/actions';
import styles from './index.styl';
import Generator from './helpers/Generator';
import GcodeViewer from './components/GcodeViewer';
import TabArea from './TabArea';


/**
 * @component Surfacing
 * @description Main component for displaying Surfacing
 * @prop {Function} onClose - Function to close the current modal
 */
const Surfacing = ({ onClose, showTitle }) => {
    // let visualizerRef = createRef();

    const [surfacing, setSurfacing] = useState(store.get('widgets.surfacing.defaultMetricState'));

    const [gcode, setGcode] = useState('');
    const [units, setUnits] = useState(METRIC_UNITS);

    const [currentTab, setCurrentTab] = useState(0);

    const runGenerate = throttle(async () => {
        const generator = new Generator({ surfacing, units, controller });

        const gcode = generator.handleGenerate();

        const serializedFile = new File([gcode], 'surfacing.gcode');

        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);

        setGcode(gcode);
    }, 1000, { leading: true });

    const handleChange = ({ target, shouldConvert = true }) => {
        const { id, value, min, max } = target;

        const convertToImperial = (value) => Math.round(Number(value) / 25.4);

        const minimum = Number(units === METRIC_UNITS ? min : convertToImperial(min));
        const maxiumum = Number(units === METRIC_UNITS ? max : convertToImperial(max));
        const val = Math.abs(Number(value));

        if (shouldConvert && !inRange(val, minimum, maxiumum + 1)) {
            return;
        }

        if (!shouldConvert && !inRange(val, Number(min), Number(max) + 1)) {
            return;
        }

        setSurfacing(prev => ({ ...prev, [id]: val }));
    };

    const handleSelect = ({ type, value }) => {
        setSurfacing(prev => ({ ...prev, [type]: value }));
    };

    /**
     * Function to load generated gcode to main visualizer
     */
    const loadGcode = () => {
        const name = 'gSender_Surfacing';
        const { size } = new File([gcode], name);

        pubsub.publish('gcode:surfacing', { gcode, name, size });
        onClose();
    };

    const canLoad = !!gcode; //For accessing the gcode line viewer

    const tabs = [
        {
            id: 0,
            label: 'Visualizer Preview',
            widgetId: 'viz-preview',
            component: <Visualizer
                isSecondary
                widgetId="surfacing_visualizer"
                // ref={(ref) => {
                //     if (ref !== null) {
                //         visualizerRef = ref;
                //     }
                // }}
                gcode={gcode}
                surfacingData={surfacing}
            />
        },
        {
            id: 1,
            label: `G-code Viewer ${gcode && `(${gcode.split('\n').length} lines)`}`,
            widgetId: 'gcode-viewer',
            component: <GcodeViewer gcode={gcode} />,
            disabled: !gcode,
        }
    ];

    /**
     * Grab the set machine profile and workspace units on component mount
     */
    useEffect(() => {
        const machineProfile = store.get('workspace.machineProfile');
        const workspaceUnits = store.get('workspace.units');
        const { defaultMetricState, defaultImperialState } = store.get('widgets.surfacing');

        if (workspaceUnits) {
            setUnits(workspaceUnits);
        }

        if (machineProfile) {
            if (workspaceUnits === METRIC_UNITS) {
                if ((!defaultMetricState.length && !defaultMetricState.width)) {
                    setSurfacing(prev => ({
                        ...prev,
                        ...defaultMetricState,
                        length: machineProfile.mm.depth,
                        width: machineProfile.mm.width
                    }));
                } else {
                    setSurfacing(prev => ({ ...prev, ...defaultMetricState }));
                }
            }

            if (workspaceUnits === IMPERIAL_UNITS) {
                if ((!defaultImperialState.length && !defaultImperialState.width)) {
                    setSurfacing(prev => ({
                        ...prev,
                        ...defaultImperialState,
                        length: machineProfile.in.depth,
                        width: machineProfile.in.width
                    }));
                } else {
                    setSurfacing(prev => ({ ...prev, ...defaultImperialState }));
                }
            }
        }

        reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_SECONDARY });

        return () => {
            reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_PRIMARY });
        };
    }, []);

    useEffect(() => {
        const workspaceUnits = store.get('workspace.units');

        workspaceUnits === METRIC_UNITS ? store.set('widgets.surfacing.defaultMetricState', surfacing) : store.set('widgets.surfacing.defaultImperialState', surfacing);
    }, [surfacing]);

    useEffect(() => {
        // Need to re-visualize the gcode once the visualizer is re-mounted
        if (currentTab === 0 && canLoad) {
            runGenerate();
        }
    }, [currentTab]);

    return (
        <>
            {showTitle && (
                <div className={styles.header}>
                    <h3 className={styles.headerText}>Surfacing Tool</h3>
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.mainContainer}>
                    <InputArea
                        values={surfacing}
                        onChange={handleChange}
                        onSelect={handleSelect}
                        units={units}
                    />
                    <TabArea tabs={tabs} currentTab={currentTab} onTabChange={(index) => setCurrentTab(index)} />
                </div>

                <ActionArea
                    handleCancel={onClose}
                    handleGenerateGcode={runGenerate}
                    handleLoadGcode={loadGcode}
                    surfacing={surfacing}
                    canLoad={canLoad}
                />
            </div>
        </>
    );
};

Surfacing.propTypes = {
    state: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};

export default Surfacing;
