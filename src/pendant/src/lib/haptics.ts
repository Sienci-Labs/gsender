// Haptic feedback for the Android pendant app.
//
// Goes through the native bridge (`window.GSenderAndroid.vibrate`, see
// android/.../MainActivity.kt WebBridge) rather than `navigator.vibrate`: the
// WebView ignores web vibration without the VIBRATE permission and a recent
// user gesture, and an alarm has no gesture. Where the bridge doesn't exist -
// the Electron pendant, the desktop's embedded pendant view, a browser - this
// is a no-op, so haptics only ever fire in the Android build.

export type HapticKind = 'jog' | 'alarm';

// Milliseconds, alternating on/off. The bridge clamps each step to 500ms.
const PATTERNS: Record<HapticKind, number[]> = {
    jog: [30],
    alarm: [70, 90, 70],
};

type AndroidHost = Window & {
    GSenderAndroid?: { vibrate?: (pattern: string) => void };
};

export function haptic(kind: HapticKind): void {
    try {
        (window as AndroidHost).GSenderAndroid?.vibrate?.(
            PATTERNS[kind].join(','),
        );
    } catch {
        // Haptics are best-effort; never let them break a jog or alarm path.
    }
}
