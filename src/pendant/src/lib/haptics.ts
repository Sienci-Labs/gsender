// Haptic feedback for the Android pendant app.
//
// Goes through the native bridge (`window.GSenderAndroid.vibrate`, see
// android/.../MainActivity.kt WebBridge) rather than `navigator.vibrate`: the
// WebView ignores web vibration without the VIBRATE permission and a recent
// user gesture, and an alarm has no gesture. Where the bridge doesn't exist -
// the Electron pendant, the desktop's embedded pendant view, a browser - this
// is a no-op, so haptics only ever fire in the Android build.
//
// Not buzzing on the tablet? From chrome://inspect run
// `GSenderAndroid.hapticsStatus()`, and watch `adb logcat -s GSenderPendant-haptics`.

export type HapticKind = 'jog' | 'alarm';

// Milliseconds, alternating on/off. The bridge clamps each step to 500ms.
// Jog is 50ms, not shorter: cheap tablet motors need ~40ms to spin up, so a
// shorter pulse can't be felt at all.
const PATTERNS: Record<HapticKind, number[]> = {
    jog: [50],
    alarm: [80, 100, 80],
};

type AndroidHost = Window & {
    GSenderAndroid?: { vibrate?: (pattern: string, kind: string) => void };
};

let reportedMissing = false;

export function haptic(kind: HapticKind): void {
    try {
        const bridge = (window as AndroidHost).GSenderAndroid;
        if (typeof bridge?.vibrate !== 'function') {
            // Only meaningful on Android, where the bridge exists but this APK
            // predates haptics; elsewhere there's no bridge at all.
            if (bridge && !reportedMissing) {
                reportedMissing = true;
                console.warn(
                    '[haptics] GSenderAndroid.vibrate missing - rebuild the APK',
                );
            }
            return;
        }
        bridge.vibrate(PATTERNS[kind].join(','), kind);
    } catch (error) {
        // Haptics are best-effort; never let them break a jog or alarm path.
        console.warn('[haptics] vibrate failed', error);
    }
}
