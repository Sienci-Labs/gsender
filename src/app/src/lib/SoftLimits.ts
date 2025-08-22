import reduxStore from 'app/store/redux';
import get from 'lodash/get';

const OFFSET = 1; // 1mm offset on all travel movements for soft limits.

export function getZTravels() {
    const store = reduxStore.getState();
    const settings = get(store, 'controller.settings', {});
    const mpos = get(store, 'controller.mpos', {});
    console.log(settings);
    console.log(mpos);
    const zMaxTravel = Math.abs(Number(get(settings, '$132', 0)));

    return [0, 0];
}

export function getZUpTravel(requestedDistance) {
    return Math.min(getZTravels()[0] - OFFSET, requestedDistance);
}

export function getZDownTravel(requestedDistance) {
    return Math.min(getZTravels()[1] - OFFSET, requestedDistance);
}
