import reduxStore from 'app/store/redux';
import get from 'lodash/get';

const OFFSET = 1; // 1mm offset on all travel movements for soft limits.

/**
 * Calculates and returns the Z-axis travels based on machine position and settings.
 *
 * @return {Array<number>} An array of two numbers:
 *                          - The first number represents the minimum Z-axis travel UP after applying an offset.
 *                          - The second number represents the maximum Z-axis travel DOWN after deducting the current position and offset.
 */
export function getZTravels() {
    const store = reduxStore.getState();
    const settings = get(store, 'controller.settings', {});
    const mpos = get(store, 'controller.mpos', {});

    const zMaxTravel = Math.abs(Number(get(settings, 'settings.$132', 0)));
    const zMpos = Math.abs(Number(get(mpos, 'z', 0)));

    return [zMpos - OFFSET, zMaxTravel - zMpos - OFFSET];
}

/**
 * Calculates the Z-axis travel distance based on the given requested distance,
 * ensuring it does not exceed the maximum allowable travel distance.
 *
 * @param {number} requestedDistance - The distance requested for Z-axis travel.
 * @return {number} The calculated Z-axis travel distance.
 */
export function getZUpTravel(requestedDistance) {
    return Math.min(getZTravels()[0], Number(requestedDistance));
}

/**
 * Calculates the downward travel distance on the Z-axis, taking into account a specific offset,
 * and returns the smaller value between the calculated travel and the requested distance.
 *
 * @param {number} requestedDistance - The desired travel distance on the Z-axis.
 * @return {number} The computed downward travel distance, constrained by the offset and requested distance.
 */
export function getZDownTravel(requestedDistance) {
    return Math.min(getZTravels()[1], Number(requestedDistance));
}
