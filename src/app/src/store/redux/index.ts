import controller from './reducers/controllerReducers';
import connection from './reducers/connectionReducers';
import file from './reducers/fileInfoReducers';
import visualizer from './reducers/visualizerReducers';
import preferences from './reducers/preferencesReducer';

import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
    reducer: {
        controller,
        connection,
        file,
        visualizer,
        preferences,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
