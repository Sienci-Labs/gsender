import React, { createContext, useReducer } from 'react';

import store from 'app/store';
import { METRIC_UNITS, IMPERIAL_UNITS } from 'app/constants';

import { SPEED_NORMAL } from '../../JogControl/constants';
import { A_AXIS_JOG, HOLE_COUNT } from '../utils/constants';
import {
    UPDATE_PRESET,
    UPDATE_JOG,
    SET_ACTIVE_DIALOG,
    CLOSE_ACTIVE_DIALOG,
    UPDATE_PHYSICAL_UNIT_SETUP,
    SET_STOCK_TURNING_OUTPUT,
    UPDATE_STOCK_TURNING_OPTION,
    CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL,
    CONVERT_STOCK_TURNING_OPTIONS_TO_METRIC,
    SET_ACTIVE_STOCK_TURNING_TAB
} from './actions';
import { QUARTER, SHORT_TRACK } from '../constant';
import defaultState from '../../../store/defaultState';
import { convertToImperial, convertToMetric } from '../../../containers/Preferences/calculate';

const initialState = () => {
    const stockTurningOptions = store.get('widgets.rotary.stockTurning.options', {});

    const defaultStockTurningOptions = defaultState.widgets.rotary.stockTurning.options;

    return {
        units: METRIC_UNITS,
        speedPreset: SPEED_NORMAL,
        jog: { a: A_AXIS_JOG },
        activeDialog: null,
        physicalUnitSetup: {
            linesUp: false,
            drillBitDiameter: QUARTER,
            holeCount: HOLE_COUNT.SIX,
            trackLength: SHORT_TRACK
        },
        stockTurning: {
            options: { ...defaultStockTurningOptions, ...stockTurningOptions },
            activeTab: 0,
            gcode: null
        }
    };
};

const reducer = (state, action) => {
    switch (action.type) {
    case UPDATE_PRESET: {
        return { ...state, speedPreset: action.payload };
    }

    case UPDATE_JOG: {
        return { ...state, jog: action.payload };
    }

    case SET_ACTIVE_DIALOG: {
        return { ...state, activeDialog: action.payload };
    }

    case CLOSE_ACTIVE_DIALOG: {
        return { ...state, activeDialog: null };
    }

    case UPDATE_PHYSICAL_UNIT_SETUP: {
        return {
            ...state,
            physicalUnitSetup: {
                ...state.physicalUnitSetup,
                ...action.payload,
            }
        };
    }

    case SET_STOCK_TURNING_OUTPUT: {
        return {
            ...state,
            stockTurning: {
                ...state.stockTurning,
                gcode: action.payload,
            }
        };
    }

    case UPDATE_STOCK_TURNING_OPTION: {
        return {
            ...state,
            stockTurning: {
                ...state.stockTurning,
                options: {
                    ...state.stockTurning.options,
                    [action.payload.key]: action.payload.value
                }
            }
        };
    }

    case CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL: {
        const { stockLength, stepdown, bitDiameter, feedrate, startHeight, finalHeight } = state.stockTurning.options;

        return {
            ...state,
            units: IMPERIAL_UNITS,
            stockTurning: {
                ...state.stockTurning,
                options: {
                    ...state.stockTurning.options,
                    stockLength: convertToImperial(stockLength),
                    stepdown: convertToImperial(stepdown),
                    bitDiameter: convertToImperial(bitDiameter),
                    feedrate: convertToImperial(feedrate),
                    startHeight: convertToImperial(startHeight),
                    finalHeight: convertToImperial(finalHeight),
                }
            }
        };
    }

    case CONVERT_STOCK_TURNING_OPTIONS_TO_METRIC: {
        const { stockLength, stepdown, bitDiameter, feedrate, startHeight, finalHeight } = state.stockTurning.options;

        return {
            ...state,
            units: IMPERIAL_UNITS,
            stockTurning: {
                ...state.stockTurning,
                options: {
                    ...state.stockTurning.options,
                    stockLength: convertToMetric(stockLength),
                    stepdown: convertToMetric(stepdown),
                    bitDiameter: convertToMetric(bitDiameter),
                    feedrate: convertToMetric(feedrate),
                    startHeight: convertToMetric(startHeight),
                    finalHeight: convertToMetric(finalHeight),
                }
            }
        };
    }

    case SET_ACTIVE_STOCK_TURNING_TAB: {
        return {
            ...state,
            stockTurning: {
                ...state.stockTurning,
                activeTab: action.payload,
            }
        };
    }

    default: {
        return state;
    }
    }
};

export const RotaryContext = createContext({});

export const RotaryContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState());

    return (
        <RotaryContext.Provider value={{ state, dispatch }}>
            {children}
        </RotaryContext.Provider>
    );
};
