import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import { inRange, throttle } from 'lodash';
import { Provider as ReduxProvider } from 'react-redux';

import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';
import { METRIC_UNITS, IMPERIAL_UNITS, VISUALIZER_PRIMARY, VISUALIZER_SECONDARY } from 'app/constants';
import api from 'app/api';

import Visualizer from '../Visualizer';
import InputArea from '../InputArea';
import ActionArea from '../ActionArea';
import styles from '../../index.styl';
import Generator from '../../utils/Generator';
import GcodeViewer from '../GcodeViewer';
import TabArea from '../TabArea';
import { SurfacingContext } from './Context';

const convertTo = (type, val) => (type === METRIC_UNITS ? Math.round(val * 25.4) : Number((val / 25.4).toFixed(2)));

/**
 * @component Surfacing
 * @description Main component for displaying Surfacing
 * @prop {Function} onClose - Function to close the current modal
 */
const Surfacing = ({ onClose, showTitle }) => {
    const [surfacing, setSurfacing] = useState(store.get('widgets.surfacing.defaultMetricState'));

    const [gcode, setGcode] = useState('');
    const [units, setUnits] = useState(METRIC_UNITS);

    const [currentTab, setCurrentTab] = useState(0);

    const runGenerate = throttle(async () => {
        setCurrentTab(0);

        const generator = new Generator({ surfacing, units, controller });

        const gcode = generator.handleGenerate();

        const serializedFile = new File([gcode], 'surfacing.gcode');

        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);

        setGcode(gcode);
    }, 5000);

    const handleChange = ({ target, shouldConvert = true }) => {
        const { id, value, min, max } = target;

        const minimum = Number(units === METRIC_UNITS ? min : convertTo(IMPERIAL_UNITS, min));
        const maxiumum = Number(units === METRIC_UNITS ? max : convertTo(IMPERIAL_UNITS, max));
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

        if (workspaceUnits === METRIC_UNITS) {
            const imperialValues = {
                length: convertTo(IMPERIAL_UNITS, surfacing.length),
                width: convertTo(IMPERIAL_UNITS, surfacing.width),
                bitDiameter: convertTo(IMPERIAL_UNITS, surfacing.bitDiameter),
                spindleRPM: convertTo(IMPERIAL_UNITS, surfacing.spindleRPM),
                skimDepth: convertTo(IMPERIAL_UNITS, surfacing.skimDepth),
                maxDepth: convertTo(IMPERIAL_UNITS, surfacing.maxDepth),
                feedrate: convertTo(IMPERIAL_UNITS, surfacing.feedrate)
            };

            store.set('widgets.surfacing.defaultMetricState', surfacing);
            store.set('widgets.surfacing.defaultImperialState', { ...surfacing, ...imperialValues });
        }

        if (workspaceUnits === IMPERIAL_UNITS) {
            const metricValues = {
                length: convertTo(METRIC_UNITS, surfacing.length),
                width: convertTo(METRIC_UNITS, surfacing.width),
                bitDiameter: convertTo(METRIC_UNITS, surfacing.bitDiameter),
                spindleRPM: convertTo(METRIC_UNITS, surfacing.spindleRPM),
                skimDepth: convertTo(METRIC_UNITS, surfacing.skimDepth),
                maxDepth: convertTo(METRIC_UNITS, surfacing.maxDepth),
                feedrate: convertTo(METRIC_UNITS, surfacing.feedrate)
            };

            store.set('widgets.surfacing.defaultImperialState', surfacing);
            store.set('widgets.surfacing.defaultMetricState', { ...surfacing, ...metricValues });
        }
    }, [surfacing]);

    useEffect(() => {
        // Need to re-visualize the gcode once the visualizer is re-mounted
        if (currentTab === 0 && canLoad) {
            runGenerate();
        }
    }, [currentTab]);


    const canLoad = !!gcode; //For accessing the gcode line viewer
    const tabs = [
        {
            id: 0,
            label: 'Visualizer Preview',
            widgetId: 'viz-preview',
            component: <Visualizer gcode={gcode} surfacing={surfacing} />,
        },
        {
            id: 1,
            label: `G-code Viewer ${gcode && `(${gcode.split('\n').length} lines)`}`,
            widgetId: 'gcode-viewer',
            component: <GcodeViewer gcode={gcode} />,
            disabled: !gcode,
        },
    ];
    const contextValue = {
        surfacing,
        setSurfacing,
        onChange: handleChange,
        onSelect: handleSelect,
        units
    };

    return (
        <ReduxProvider store={reduxStore}>
            <SurfacingContext.Provider value={contextValue}>
                {showTitle && (
                    <div className={styles.header}>
                        <h3 className={styles.headerText}>Surfacing Tool</h3>
                    </div>
                )}

                <div className={styles.container}>
                    <div className={styles.mainContainer}>
                        <div>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.25', marginTop: '1rem', color: 'grey' }}>
                                To best surface your whole wasteboard, ensure you know the exact limits of your CNCs
                                movement and account for limit switches or other add-ons. Use a wide diameter bit to
                                clear the largest space and consider turning off hard and soft limits so you don&apos;t
                                encounter alarms or errors.
                            </p>
                            <InputArea />
                        </div>
                        <TabArea tabs={tabs} currentTab={currentTab} onTabChange={(index) => setCurrentTab(index)} />
                    </div>

                    <ActionArea
                        handleCancel={onClose}
                        handleGenerateGcode={runGenerate}
                        handleLoadGcode={loadGcode}
                        canLoad={canLoad}
                    />
                </div>
            </SurfacingContext.Provider>
        </ReduxProvider>
    );
};

Surfacing.propTypes = {
    onClose: PropTypes.func.isRequired,
    showTitle: PropTypes.bool,
};

export default Surfacing;
