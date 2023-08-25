import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import map from 'lodash/map';
import get from 'lodash/get';
import pubsub from 'pubsub-js';

import api from 'app/api';
import controller from 'app/lib/controller';
import store from 'app/store';
import { WORKSPACE_MODE, METRIC_UNITS, VISUALIZER_PRIMARY } from 'app/constants';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import styles from './index.styl';
import RotaryToggle from './RotaryToggle';
import DROarea from './DROarea';
import JogControlArea from './JogControlArea';
import SpeedControls from './SpeedControls';
import ActionArea from './ActionArea';
import { SPEED_NORMAL, SPEED_PRECISE, SPEED_RAPID } from '../JogControl/constants';
import PhysicalUnitSetup from './PhysicalUnitSetup';
import { RotaryContext } from './Context';
import { MODALS } from './utils/constants';
import StockTurning from './StockTurning';

let pubsubTokens = [];

const Rotary = () => {
    const { state: { activeDialog } } = useContext(RotaryContext);
    const [speedPreset, setSpeedPreset] = useState(SPEED_NORMAL);
    const [jog, setJog] = useState({ ...store.get('widgets.axes.jog', { aStep: '5.00' }) });
    const [, setIsContinuousJogging] = useState(false);
    const { state: controllerState, type: controllerType } = useSelector(state => state.controller);

    useEffect(() => {
        subscribe();

        return () => {
            unsubscribe();
        };
    }, []);

    const subscribe = () => {
        const tokens = [
            pubsub.subscribe('jog_preset_selected', (msg, speed) => {
                actions.setSelectedSpeed(speed);
            }),
        ];

        pubsubTokens = pubsubTokens.concat(tokens);
    };

    const unsubscribe = () => {
        pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        pubsubTokens = [];
    };

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
            const modal = 'G21';
            const s = map(params, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
            const commands = [
                `$J=${modal}G91 ` + s,
            ];
            controller.command('gcode', commands, modal);
        },
        startContinuousJog: (params = {}, feedrate = 1000) => {
            setIsContinuousJogging(true);

            controller.command('jog:start', params, feedrate, METRIC_UNITS);
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
            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
            const command = `G10 P${p} L20 ${axis.toUpperCase()}${value}`;
            controller.command('gcode:safe', command, modal);
        },
        loadGcode: async (rotarySetupGcode = null) => {
            const name = 'gSender_RotaryUnitSetup';
            const file = new File([rotarySetupGcode], name);

            await api.file.upload(file, controller.port, VISUALIZER_PRIMARY);
        },
        runProbing: (name = 'rotary', commands) => {
            Toaster.pop({
                msg: `Running ${name} probing commands`,
                type: TOASTER_INFO,
            });
            controller.command('gcode:safe', commands, 'G21');
        }
    };

    const isFileRunning = () => {
        return controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run';
    };

    const { ROTARY } = WORKSPACE_MODE;
    const workspaceMode = store.get('workspace.mode');
    const enableRotaryAxis = (workspaceMode === ROTARY && controllerType === 'Grbl') || controllerType === 'grblHAL';

    const ActiveModal = {
        [MODALS.PHYSICAL_UNIT_SETUP]: PhysicalUnitSetup,
        [MODALS.STOCK_TURNING]: StockTurning,
    }[activeDialog];

    return (
        <div className={styles['rotary-axis-wrapper']}>
            <div className={styles['rotary-jog-control-area']}>
                <p className={styles['rotary-tab-section-title']}>
                    Jog Control
                </p>
                <DROarea actions={actions} canClick={enableRotaryAxis && !isFileRunning()} />

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <JogControlArea
                        selectedSpeed={speedPreset} actions={actions} jog={jog}
                        disabled={!enableRotaryAxis || isFileRunning()}
                    />
                    <SpeedControls jog={jog} actions={actions} />
                </div>
            </div>

            <div className={styles['rotary-tools-area']}>
                <p className={styles['rotary-tab-section-title']}>Tools</p>
                <RotaryToggle />

                <ActionArea actions={actions} />

                {ActiveModal && <ActiveModal actions={actions} />}
            </div>
        </div>
    );
};

export default Rotary;
