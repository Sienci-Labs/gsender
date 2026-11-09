import { useEffect, useState } from 'react';

// The Battery Status API (Chromium only - Android WebView and Electron, which
// is all the pendant runs in). Not in lib.dom, so typed here.
type BatteryManager = EventTarget & {
    charging: boolean;
    level: number;
};

export type BatteryState = {
    /** 0-100 */
    percent: number;
    charging: boolean;
};

/** The device's battery, or null where the API is missing. A machine with no
 * battery reports charging at 100%, so it reads the same as plugged in. */
export function useBattery(): BatteryState | null {
    const [state, setState] = useState<BatteryState | null>(null);

    useEffect(() => {
        const nav = navigator as Navigator & {
            getBattery?: () => Promise<BatteryManager>;
        };
        if (!nav.getBattery) return undefined;

        let battery: BatteryManager | null = null;
        let cancelled = false;
        const update = () => {
            if (!battery || cancelled) return;
            setState({
                percent: Math.round(battery.level * 100),
                charging: battery.charging,
            });
        };

        nav.getBattery()
            .then((b) => {
                if (cancelled) return;
                battery = b;
                update();
                b.addEventListener('levelchange', update);
                b.addEventListener('chargingchange', update);
            })
            .catch(() => {
                // Blocked by permissions policy - leave it unknown.
            });

        return () => {
            cancelled = true;
            battery?.removeEventListener('levelchange', update);
            battery?.removeEventListener('chargingchange', update);
        };
    }, []);

    return state;
}
