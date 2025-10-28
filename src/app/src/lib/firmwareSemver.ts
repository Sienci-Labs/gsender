import reduxStore from 'app/store/redux';
import get from 'lodash/get';
/**
 * Predicate whether the currently reported firmware version exceeds the required version
 * @param reported Number reported by the firmware
 * @param required Version to use as a cutoff (reported must be the same or above this version)
 */
export function firmwareSemver(reported: number, required: number): boolean {
    return Number(reported) >= Number(required);
}

export function firmwarePastVersion(required: number): boolean {
    if (Number.isNaN(required)) {
        return false;
    }

    const reduxState = reduxStore.getState();
    console.log(reduxState);
    const reportedFirmwareVersion = get(
        reduxState,
        'controller.settings.version.semver',
        0,
    );
    console.log(reportedFirmwareVersion, required);
    return Number(reportedFirmwareVersion) >= Number(required);
}
