import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ShortcutSliceState } from "app/store/definitions.ts";

const initialState: ShortcutSliceState = {
	isFinished: false,
};

const shortcutsSlice = createSlice({
	name: "gSenderInfo",
	initialState,
	reducers: {
		updateShuttleStatus: (
			state: ShortcutSliceState,
			action: PayloadAction<{ isFinished: boolean }>,
		) => {
			state.isFinished = action.payload.isFinished;
		},
	},
});

export const { updateShuttleStatus } = shortcutsSlice.actions;

export default shortcutsSlice.reducer;
