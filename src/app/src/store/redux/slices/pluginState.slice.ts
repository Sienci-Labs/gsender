import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Plugin-asserted machine state that the host UI and other plugins consume.
//
// `busy` lets a plugin flag the machine as persistently occupied for the whole
// span of an operation it drives through the feeder (e.g. Screw Spot drilling a
// batch of holes). The feeder streams line-by-line, so the raw controller
// `activeState` dips to Idle between moves — this flag lets the UI keep showing
// a stable "running" status instead of flickering. The host owns the release
// lifecycle (see pluginBridge), so setting `busy` true is fire-and-set: the host
// clears it once the machine has genuinely gone idle.
export interface PluginReduxState {
	busy: boolean;
	// Optional human label shown in place of the machine status (e.g. the plugin
	// name / operation). Null falls back to a generic "Running".
	label: string | null;
}

const initialState: PluginReduxState = {
	busy: false,
	label: null,
};

const pluginStateSlice = createSlice({
	name: "pluginState",
	initialState,
	reducers: {
		setPluginBusy: (
			state,
			action: PayloadAction<{ busy: boolean; label?: string | null }>,
		) => {
			state.busy = action.payload.busy;
			state.label = action.payload.busy ? (action.payload.label ?? null) : null;
		},
	},
});

export const { setPluginBusy } = pluginStateSlice.actions;

export default pluginStateSlice.reducer;
