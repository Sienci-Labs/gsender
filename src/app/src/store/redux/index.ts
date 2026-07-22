import { configureStore } from "@reduxjs/toolkit";
import { sagaMiddleware } from "./sagas";
import connection from "./slices/connection.slice";
import console from "./slices/console.slice";
import controller from "./slices/controller.slice";
import file from "./slices/fileInfo.slice";
import gSenderInfo from "./slices/gSenderInfo.slice.ts";
import helper from "./slices/helper.slice";
import pluginState from "./slices/pluginState.slice";
import preferences from "./slices/preferences.slice";
import shortcuts from "./slices/shortcuts.slice.ts";
import visualizer from "./slices/visualizer.slice";

export const store = configureStore({
	reducer: {
		controller,
		connection,
		file,
		visualizer,
		preferences,
		console,
		helper,
		gSenderInfo,
		shortcuts,
		pluginState,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(sagaMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
