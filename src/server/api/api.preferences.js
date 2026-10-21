import logger from "../lib/logger";
import preferencesStore from "../services/configstore/preferencesStore";
import { ERR_INTERNAL_SERVER_ERROR } from "../constants";

const log = logger("api:preferences");

export const fetch = (req, res) => {
	res.send(preferencesStore.get());
};

export const replace = (req, res) => {
	const { version, state, originId } = req.body || {};

	// never let an empty/missing state replace the saved preferences
	if (!state || typeof state !== "object" || Object.keys(state).length === 0) {
		res.status(400).send({ msg: "Preferences state is required" });
		return;
	}

	try {
		preferencesStore.replace({ version, state });
		res.send({ message: "gSender preferences saved" });
	} catch (err) {
		log.error(`Failed to save preferences: ${err.message}`);
		res.status(ERR_INTERNAL_SERVER_ERROR).send({
			msg: "Failed to save gSender preferences",
		});
		return;
	}

	// Lazy require: importing cncengine at module scope drags the controller stack in
	// (same pattern as api.plugins.js).
	try {
		require("../services/cncengine").default.emit("preferences:changed", {
			version,
			state,
			originId,
		});
	} catch (err) {
		log.error(`Failed to notify clients of preference changes: ${err.message}`);
	}
};
