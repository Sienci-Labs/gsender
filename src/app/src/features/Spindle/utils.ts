import {
	GRBL,
	GRBL_ACTIVE_STATE_IDLE,
	GRBLHAL,
	WORKFLOW_STATE_RUNNING,
} from "app/constants";
import get from "lodash/get";
import includes from "lodash/includes";

export const canClick = (
	isConnected: boolean,
	workflow: any,
	state: any,
	type: any,
) => {
	if (!isConnected) {
		return false;
	}

	if (workflow.state === WORKFLOW_STATE_RUNNING) {
		return false;
	}

	if (!includes([GRBL, GRBLHAL], type)) {
		return false;
	}

	const activeState = get(state, "status.activeState");
	const states = [GRBL_ACTIVE_STATE_IDLE];

	return includes(states, activeState);
};
