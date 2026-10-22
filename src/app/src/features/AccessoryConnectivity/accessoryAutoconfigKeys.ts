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

const ACCESSORY_INSTALLER_ROUTE = '/tools/accessoryInstall';

// Accessories with their own installer wizard; the rest open the installer's list
const ACCESSORY_WIZARD_IDS: Partial<Record<AccessoryAutoconfigKey, string>> = {
    AUTOSPIN: 'autospin',
    ATCEXP: 'sienci-atc',
    TLS: 'sienci-tls',
};

export function accessoryManageRoute(key: string): string {
    const wizardId = ACCESSORY_WIZARD_IDS[key as AccessoryAutoconfigKey];
    return wizardId
        ? `${ACCESSORY_INSTALLER_ROUTE}/${wizardId}`
        : ACCESSORY_INSTALLER_ROUTE;
}

export function isAccessoryConnected(
    rawValue: string | null | undefined,
): boolean {
    return rawValue !== undefined && rawValue !== null && rawValue !== '0';
}
