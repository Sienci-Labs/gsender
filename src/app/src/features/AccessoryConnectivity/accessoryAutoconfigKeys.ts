// Keys within grblHAL's [NEWOPT:...]/[MSG:Info: Autoconfig: ...] payloads that
// represent accessory presence. Add future accessory keys here — both the
// startup baseline capture and the runtime toast diffing read from this list.
export const ACCESSORY_AUTOCONFIG_KEYS = [
    'AUTOSPIN',
    'H100',
    'ATCEXP',
    'ETHERNET',
    'PROBE',
    'TLS',
] as const;

export type AccessoryAutoconfigKey = (typeof ACCESSORY_AUTOCONFIG_KEYS)[number];

export function isAccessoryConnected(
    rawValue: string | null | undefined,
): boolean {
    return rawValue !== undefined && rawValue !== null && rawValue !== '0';
}
