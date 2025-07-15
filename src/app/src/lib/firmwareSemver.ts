/**
 * Predicate whether the currently reported firmware version exceeds the required version
 * @param reported Number reported by the firmware
 * @param required Version to use as a cutoff (reported must be the same or above this version)
 */
export function firmwareSemver(reported: number, required: number): boolean {
    return Number(reported) >= Number(required);
}
