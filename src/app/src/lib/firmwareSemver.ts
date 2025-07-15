/**
 *
 * @param reported Number reported by the firmware
 * @param cutoff Version to use as a cutoff (reported must be the same or above this version)
 */
export function firmwareSemver(reported: number, cutoff: number): boolean {
    return Number(reported) >= Number(cutoff);
}
