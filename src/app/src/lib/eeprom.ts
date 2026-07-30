import {
	BACK_LEFT,
	FRONT_LEFT,
	FRONT_RIGHT,
	getHomingLocation,
} from "app/features/DRO/utils/RapidPosition.ts";
import type { HOMING_LOCATIONS_T } from "definitions/firmware";

export const homingString = (mask: string): string => {
	let location = "";
	const placement: HOMING_LOCATIONS_T = getHomingLocation(mask);
	if (placement === FRONT_LEFT) {
		location = "Front Left";
	} else if (placement === FRONT_RIGHT) {
		location = "Front Right";
	} else if (placement === BACK_LEFT) {
		location = "Back Left";
	} else {
		location = "Back Right";
	}
	return `${mask} (${location})`;
};
