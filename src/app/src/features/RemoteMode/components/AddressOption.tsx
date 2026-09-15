import type { NetworkAddress, NetworkAddressKind } from 'app/store/definitions';
import cx from 'classnames';
import {
    Box,
    CircleAlert,
    CircleCheck,
    Laptop,
    Network,
    Wifi,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { BsEthernet } from 'react-icons/bs';

// Mixed icon sets, so type on the shared prop rather than on either library:
// ethernet uses the same RJ45 plug the Connection widget uses (PortListings.tsx).
const ICONS: Record<
    NetworkAddressKind,
    ComponentType<{ className?: string }>
> = {
    wifi: Wifi,
    ethernet: BsEthernet,
    virtual: Box,
    loopback: Laptop,
    unknown: Network,
};

export const kindIcon = (kind?: NetworkAddressKind) =>
    (kind && ICONS[kind]) || Network;

// Short note explaining what an address is, or why it won't work. Shown as the
// right-hand column of a dropdown row, so it has to stay narrow enough to sit
// beside the address without crowding it.
export function addressDescription(entry: NetworkAddress): string {
    if (entry.kind === 'loopback') {
        return 'This computer only';
    }
    if (entry.kind === 'virtual') {
        return 'Virtual';
    }
    if (!entry.usable) {
        return 'No network';
    }
    return entry.label;
}

// A single row in the open dropdown list.
export function AddressOption({ entry }: { entry: NetworkAddress }) {
    const Icon = kindIcon(entry.kind);

    return (
        <>
            <span
                className="flex flex-row items-center gap-2 min-w-0"
                title={entry.iface}
            >
                <Icon
                    className={cx('w-4 h-4 shrink-0', {
                        'text-green-600 dark:text-green-400': entry.recommended,
                        'text-gray-500 dark:text-content-muted':
                            !entry.recommended && entry.usable,
                        'text-gray-400 dark:text-content-disabled':
                            !entry.usable,
                    })}
                />
                <span
                    className={cx('font-mono truncate', {
                        'text-green-700 dark:text-green-400 font-semibold':
                            entry.recommended,
                        'text-gray-400 dark:text-content-disabled':
                            !entry.usable,
                    })}
                >
                    {entry.address}
                </span>
            </span>
            {entry.recommended ? (
                <span className="ml-3 shrink-0 rounded-full px-2 py-px text-[10px] font-semibold uppercase tracking-wide bg-green-600/10 text-green-700 dark:bg-green-400/15 dark:text-green-300">
                    Recommended
                </span>
            ) : (
                <span
                    className={cx('ml-3 shrink-0 text-[11px]', {
                        'text-gray-500 dark:text-content-muted': entry.usable,
                        'text-gray-400 dark:text-content-disabled':
                            !entry.usable,
                    })}
                >
                    {addressDescription(entry)}
                </span>
            )}
        </>
    );
}

/*
 * The compact form shown on the closed trigger. Deliberately narrower than a
 * list row so the control stays the same width as the port input, and tolerant
 * of an address that is no longer present on this computer.
 */
export function AddressSummary({
    address,
    entry,
}: {
    address: string;
    entry: NetworkAddress | null;
}) {
    const Icon = kindIcon(entry?.kind);

    return (
        <>
            <Icon
                className={cx('w-4 h-4 shrink-0', {
                    'text-green-600 dark:text-green-400': entry?.recommended,
                    'text-gray-500 dark:text-content-muted':
                        !entry?.recommended,
                })}
            />
            <span className="font-mono truncate dark:text-content-primary">
                {address}
            </span>
            {/* Pushed to the right edge of the trigger rather than hugging the
			    address, so it reads as a status marker for the whole field. */}
            {entry?.recommended && (
                <CircleCheck className="w-[18px] h-[18px] shrink-0 ml-auto text-green-600 dark:text-green-400" />
            )}
            {entry && !entry.usable && (
                <CircleAlert className="w-[18px] h-[18px] shrink-0 ml-auto text-amber-600 dark:text-amber-400" />
            )}
        </>
    );
}

export default AddressOption;
