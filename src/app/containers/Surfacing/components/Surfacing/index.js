import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import { Provider as ReduxProvider } from 'react-redux';

import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';
import { METRIC_UNITS, VISUALIZER_PRIMARY, VISUALIZER_SECONDARY } from 'app/constants';
import api from 'app/api';

import Visualizer from '../Visualizer';
import InputArea from '../InputArea';
import ActionArea from '../ActionArea';
import styles from '../../index.styl';
import Generator from '../../utils/Generator';
// import { convertValuesToImperial } from '../../utils';
import GcodeViewer from '../GcodeViewer';
import TabArea from '../TabArea';
import { SurfacingContext } from './Context';

/**
 * @component Surfacing
 * @description Main component for displaying Surfacing
 * @prop {Function} onClose - Function to close the current modal
 */
const Surfacing = ({ onClose, showTitle }) => {
    const [surfacing, setSurfacing] = useState(store.get('widgets.surfacing'));

    const [gcode, setGcode] = useState('');
    const [units] = useState(store.get('workspace.units') || METRIC_UNITS);

    const [currentTab, setCurrentTab] = useState(0);

    const runGenerate = async () => {
        setCurrentTab(0);

        const generator = new Generator({ surfacing, units, controller });

        const gcode = generator.generate();

        const serializedFile = new File([gcode], 'surfacing.gcode');

        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);

        setGcode(gcode);
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

    const handleChange = ({ target, shouldConvert = true }) => {
        const { id, value } = target;

        const val = Math.abs(Number(value));

        setSurfacing(prev => ({ ...prev, [id]: val }));
    };

    const handleSelect = ({ type, value }) => {
        setSurfacing(prev => ({ ...prev, [type]: value }));
    };

    /**
     * Prepare secondary surfacing visualizer and unmount the main one to improve performance
     * (Having two three.js scenes makes the app choppy even or higher spec machines)
     */
    useEffect(() => {
        reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_SECONDARY });

        if (surfacing.length === 0 && surfacing.width === 0) {
            const machineProfile = store.get('workspace.machineProfile');

            if (machineProfile) {
                setSurfacing(prev => ({
                    ...prev,
                    length: units === METRIC_UNITS ? machineProfile.mm.depth : machineProfile.in.depth,
                    width: units === METRIC_UNITS ? machineProfile.mm.width : machineProfile.in.width
                }));
            }
        }

        return () => {
            reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_PRIMARY });
        };
    }, []);

    useEffect(() => {
        store.replace('widgets.surfacing', surfacing);
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
        gcode,
        units,
        canLoad,
        setSurfacing,
        onChange: handleChange,
        onSelect: handleSelect,
        runGenerate,
        loadGcode
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
                                <b>For ideal wasteboard surfacing:</b> know your CNCs exact movement limits accounting for limit switches and other add-ons, get nicer and faster cuts using your widest diameter bit, and consider turning off hard and soft limits so you don&apos;t encounter alarms or errors.
                            </p>
                            <InputArea />
                        </div>
                        <TabArea tabs={tabs} currentTab={currentTab} onTabChange={(index) => setCurrentTab(index)} />
                    </div>

                    <ActionArea />
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
