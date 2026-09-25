import type { HelperKind, HelperMessage, HelperResource } from './types';

// Homing is enabled and the machine hasn't homed since power-on/reset. This is
// expected setup behaviour, not a fault, so the text says so up front.
const HOMING_REQUIRED: Partial<HelperMessage> = {
    title: 'Homing required',
    description:
        'Nothing is wrong with your machine. Homing is turned on in your settings, so the controller waits for you to home before it will move. Homing uses your limit switches to find machine home, so gSender knows exactly where the machine is within its travel limits and can use soft limits to stop it from running past the end of an axis.',
    steps: [
        'Make sure nothing is in the way of the gantry, then click "Click to Run Homing". The machine moves to its limit switches and sets machine home.',
        'Once homing finishes, jog and run jobs as normal. You only need to home again after the controller is powered on or reset.',
        'If your machine has no limit switches, turn off Config ➜ Homing/Limits ➜ Homing cycle enable. Note that soft limits need homing to work.',
    ],
    resource: {
        label: 'Homing & machine coordinates',
        url: 'https://resources.sienci.com/view/cnc-machine-coordinates/#homing',
    },
};

// Extra content per alarm/error, merged over the controller's own text one
// field at a time (so an entry can add only a `resource` or `steps`).
// Keys are `${kind}:${code}`, e.g. 'alarm:9'. A controller-specific key such
// as 'grblhal:alarm:9' is checked first.
export const HELPER_REGISTRY: Record<string, Partial<HelperMessage>> = {
    // grbl's literal code; grblHAL's alarm table carries it too
    'alarm:Homing': HOMING_REQUIRED,
    // grblHAL only: grbl's numeric alarms stop at 9
    'grblhal:alarm:11': HOMING_REQUIRED,
};

// Resource shown when neither the payload nor the registry provides one
export const DEFAULT_RESOURCES: Partial<Record<HelperKind, HelperResource>> = {
    alarm: {
        label: 'Alarm & error codes',
        url: 'https://resources.sienci.com/view/gs-gsender-grbl-alarm-error-codes/#alarms',
    },
};
