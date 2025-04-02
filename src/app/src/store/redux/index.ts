import { configureStore } from '@reduxjs/toolkit';

import controller from './slices/controller.slice';
import connection from './slices/connection.slice';
import file from './slices/fileInfo.slice';
import visualizer from './slices/visualizer.slice';
import preferences from './slices/preferences.slice';
import console from './slices/console.slice';
import helper from './slices/helper.slice';
import keyboardShortcuts from './slices/keyboardShortcutsSlice';
import gSenderInfo from './slices/gSenderInfo.slice.ts';
import gamepad from './slices/gamepadSlice';
import { sagaMiddleware } from './sagas';

export const store = configureStore({
    reducer: {
        controller,
        connection,
        file,
        visualizer,
        preferences,
        console,
        helper,
        keyboardShortcuts,
        gamepad,
        gSenderInfo,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(sagaMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
