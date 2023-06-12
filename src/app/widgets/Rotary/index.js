import React, { useState } from 'react';
import classNames from 'classnames';
import map from 'lodash/map';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import api from 'app/api';

import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import store from 'app/store';
import { WORKSPACE_MODE, METRIC_UNITS, VISUALIZER_SECONDARY } from 'app/constants';

import {
    Toaster,
    TOASTER_DANGER
} from '../../lib/toaster/ToasterLib';

import styles from './index.styl';
import RotaryToggle from './RotaryToggle';
import DROarea from './DROarea';
import JogControlArea from './JogControlArea';
import SpeedPresets from './SpeedPresets';
import SpeedControls from './SpeedControls';
// import StockDiameter from './StockDiameter';
import ActionArea from './ActionArea';
import { SPEED_NORMAL, SPEED_PRECISE, SPEED_RAPID } from '../JogControl/constants';
import PhysicalUnitSetup from './PhysicalUnitSetup';
import { LINES_UP, QUARTER, SIX } from './constant';
import log from '../../lib/log';

/**
 * Custom error for when Rotary setup object was not found in store
 */
class NoSetupFileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoSetupFileError';
    }
}

const Rotary = ({ active }) => {
    const [speedPreset, setSpeedPreset] = useState(SPEED_NORMAL);
    const [jog, setJog] = useState({
        ...store.get('widgets.axes.jog'),
        aStep: '5.00',
    });
    const [, setIsContinuousJogging] = useState(false);
    const [physicalSetupState, setPhysicalSetupState] = useState(initialSetupState());
    const { state: controllerState, type: controllerType } = useSelector(state => state.controller);
    const [setupFile, setSetupFIle] = useState(null);

    const { ROTARY } = WORKSPACE_MODE;
    const workspaceMode = store.get('workspace.mode');
    const enableRotaryAxis = (workspaceMode === ROTARY && controllerType === 'Grbl') || controllerType === 'grblHAL';

    function initialSetupState() {
        return {
            showDialogue: false,
            linesUp: LINES_UP,
            drillDiameter: QUARTER,
            holeCount: SIX,
        };
    }

    const actions = {
        setSelectedSpeed: (speed) => {
            setSpeedPreset(speed);

            const aValues = {
                [SPEED_PRECISE]: { step: '1.00', feedrate: 1000 },
                [SPEED_NORMAL]: { step: '5.00', feedrate: 3000 },
                [SPEED_RAPID]: { step: '20.00', feedrate: 5000 },
            }[speed];

            setJog(prev => ({ ...prev, aStep: aValues.step, feedrate: aValues.feedrate }));
        },
        setJogFromPreset: (presetKey) => {
            setJog(prev => {
                const units = store.get('workspace.units', METRIC_UNITS);
                const jogObj = jog[presetKey][units];
                return ({ ...prev, jogObj });
            });
        },
        jog: (params = {}) => {
            const units = store.get('workspace.units', METRIC_UNITS);

            const modal = (units === 'mm') ? 'G21' : 'G20';
            const s = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            const commands = [
                `$J=${modal}G91 ` + s,
            ];
            controller.command('gcode', commands, modal);
        },
        startContinuousJog: (params = {}, feedrate = 1000) => {
            const units = store.get('workspace.units', METRIC_UNITS);

            setIsContinuousJogging(true);

            controller.command('jog:start', params, feedrate, units);
        },
        stopContinuousJog: () => {
            setIsContinuousJogging(false);
            controller.command('jog:stop');
        },
        handleAStepChange: (value) => {
            setJog(prev => ({ ...prev, aStep: value }));
        },
        handleFeedrateChange: (value) => {
            setJog(prev => ({ ...prev, feedrate: value }));
        },
        getWorkCoordinateSystem: () => {
            const defaultWCS = 'G54';

            return get(controllerState, 'parserstate.modal.wcs', defaultWCS);
        },
        handleManualMovement: (value, axis) => {
            const { units } = store.get('workspace.units', METRIC_UNITS);
            const wcs = actions.getWorkCoordinateSystem();
            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;
            //const command = `G90 G0 ${axis.toUpperCase()}${value}`;
            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
            const command = `G10 P${p} L20 ${axis.toUpperCase()}${value}`;
            controller.command('gcode:safe', command, modal);
        },
        uploadSetup: (rotarySetupGcode, callback) => {
            if (!rotarySetupGcode) {
                callback(new NoSetupFileError('No setup files found'));
                return;
            }
            const serializedFile = new File([rotarySetupGcode], 'rotary.nc');
            api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY, (error) => {
                if (error) {
                    callback(error);
                    return;
                }
                setSetupFIle(rotarySetupGcode);
                callback(null);
            });
        },

        loadGcode: (rotarySetupFile = null, callback) => {
            actions.uploadSetup(rotarySetupFile, (error) => {
                if (error) {
                    log.error(error);
                    Toaster.pop({
                        type: TOASTER_DANGER,
                        msg: error.message
                    });
                    callback(false);
                    return;
                }
                pubsub.publish('gcode:rotarySetup', { setupFile, name: 'setup' });
                callback(true);
            });
        }

    };

    const isFileRunning = () => {
        if (controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run') {
            return true;
        } else {
            return false;
        }
    };

    return (
        <Widget>
            <Widget.Content
                active={active}
                className={classNames(
                    styles['widget-content'],
                    styles.heightOverride,
                )}
            >
                <div className={styles['rotary-axis-wrapper']}>
                    <div className={styles['rotary-jog-control-area']}>
                        <p className={styles['rotary-tab-section-title']}>
                            Jog Control
                        </p>
                        <DROarea actions={actions} canClick={enableRotaryAxis && !isFileRunning()} />
                        <JogControlArea
                            selectedSpeed={speedPreset} actions={actions} jog={jog}
                            disabled={!enableRotaryAxis || isFileRunning()}
                        />
                        <SpeedPresets selectedSpeed={speedPreset} actions={actions} />
                        <SpeedControls jog={jog} actions={actions} />
                    </div>

                    <div className={styles['rotary-tools-area']}>
                        <p className={styles['rotary-tab-section-title']}>Tools</p>
                        <RotaryToggle />
                        {/* <StockDiameter /> */}
                        <ActionArea
                            physicalSetupState={physicalSetupState}
                            setPhysicalSetupState={setPhysicalSetupState}
                        />
                        <PhysicalUnitSetup
                            actions={actions}
                            physicalSetupState={physicalSetupState}
                            setPhysicalSetupState={setPhysicalSetupState}
                        />
                    </div>
                </div>
            </Widget.Content>
        </Widget>
    );
};

export default Rotary;
