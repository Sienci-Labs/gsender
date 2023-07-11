import React, { createContext, useReducer } from 'react';

import { SPEED_NORMAL } from '../../JogControl/constants';
import { A_AXIS_JOG, HOLE_COUNT } from '../utils/constants';
import { UPDATE_PRESET, UPDATE_JOG, SET_ACTIVE_DIALOG, CLOSE_ACTIVE_DIALOG, UPDATE_PHYSICAL_UNIT_SETUP } from './actions';
import { QUARTER } from '../constant';

const initialState = {
    speedPreset: SPEED_NORMAL,
    jog: { a: A_AXIS_JOG },
    activeDialog: null,
    physicalUnitSetup: {
        linesUp: false,
        drillBitDiameter: QUARTER,
        holeCount: HOLE_COUNT.SIX
    },
    stockTurning: {
        bitDiameter: 6.35,
        stepover: 0.15,
        feedrate: 3000,
        stockLength: 100,
        startHeight: 25,
        finalHeight: 20,
        stepdown: 20,
        gcode: null,
    }
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

    default: {
        return state;
    }
    }
};

export const RotaryContext = createContext({});

export const RotaryContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <RotaryContext.Provider value={{ state, dispatch }}>
            {children}
        </RotaryContext.Provider>
    );
};
