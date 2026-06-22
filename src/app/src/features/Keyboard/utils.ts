import { MACRO_CATEGORY } from "app/constants";
import {
	CommandKey,
	CommandKeys,
	ShuttleEvent,
} from "app/lib/definitions/shortcuts";
import shuttleEvents from "app/lib/shuttleEvents";

const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

export const AVAILABILITY_TYPES = {
	DEFAULT: "DEFAULT",
	AVAILABLE: "AVAILABLE",
	UNAVAILABLE: "UNAVAILABLE",
	IS_THE_SAME: "IS_THE_SAME",
};

export const generateList = (shortcuts: CommandKeys) => {
	if (!shortcuts) {
		return [];
	}
	const shortcutsList: CommandKey[] = [];

	Object.keys(shortcuts).forEach((key) => {
		if (key !== "STOP_CONT_JOG") {
			shortcutsList.push(shortcuts[key]);
		}
	});

	shortcutsList.sort((a, b) => {
		let categoryA = MACRO_CATEGORY;
		let categoryB = MACRO_CATEGORY;
		if (allShuttleControlEvents[a.cmd]) {
			categoryA =
				(allShuttleControlEvents[a.cmd] as ShuttleEvent).category ||
				MACRO_CATEGORY;
		}
		if (allShuttleControlEvents[b.cmd]) {
			categoryB =
				(allShuttleControlEvents[b.cmd] as ShuttleEvent).category ||
				MACRO_CATEGORY;
		}
		return categoryA.localeCompare(categoryB);
	});

	return shortcutsList;
};
