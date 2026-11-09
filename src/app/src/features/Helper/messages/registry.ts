import { tk } from 'app/i18n';
import type { HelperKind, HelperMessage, HelperResource } from './types';

// Text here is translation keys marked with tk(), resolved when a message is
// normalized so it follows the current language (English source:
// i18n/locales/en/helper.json).

// Homing is enabled and the machine hasn't homed since power-on/reset. This is
// expected setup behaviour, not a fault, so the text says so up front.
const HOMING_REQUIRED: Partial<HelperMessage> = {
    title: tk('helper:alarm.homingRequired.title'),
    description: tk('helper:alarm.homingRequired.description'),
    steps: [
        tk('helper:alarm.homingRequired.steps.0'),
        tk('helper:alarm.homingRequired.steps.1'),
        tk('helper:alarm.homingRequired.steps.2'),
    ],
    resource: {
        label: tk('helper:resources.homing'),
        url: 'https://resources.sienci.com/view/cnc-machine-coordinates/#homing',
    },
};

// Shared source for both the hard and soft limit blurbs below
const LIMIT_ALARM_RESOURCE: HelperResource = {
    label: tk('helper:resources.limitAlarms'),
    url: 'https://sienci.zendesk.com/hc/en-us/articles/41566952133524-Alarm-1-Alarm-2',
};

// Alarm 1: a physical limit switch was triggered — machine position may be lost
const HARD_LIMIT: Partial<HelperMessage> = {
    title: tk('helper:alarm.1.title'),
    description: tk('helper:alarm.1.description'),
    steps: [
        tk('helper:alarm.1.steps.0'),
        tk('helper:alarm.1.steps.1'),
        tk('helper:alarm.1.steps.2'),
    ],
    resource: LIMIT_ALARM_RESOURCE,
};

// Alarm 2: a commanded move would exceed firmware travel limits — position retained
const SOFT_LIMIT: Partial<HelperMessage> = {
    title: tk('helper:alarm.2.title'),
    description: tk('helper:alarm.2.description'),
    steps: [
        tk('helper:alarm.2.steps.0'),
        tk('helper:alarm.2.steps.1'),
        tk('helper:alarm.2.steps.2'),
    ],
    resource: LIMIT_ALARM_RESOURCE,
};

// Shared source for the probe-fail blurbs (alarm 4 & 5)
const PROBE_FAIL_RESOURCE: HelperResource = {
    label: tk('helper:resources.probeFail'),
    url: 'https://sienci.zendesk.com/hc/en-us/articles/52195910796052-Alarm-4-Alarm-5',
};

const PROBE_FAIL_STEPS = [
    tk('helper:alarm.probeFail.steps.0'),
    tk('helper:alarm.probeFail.steps.1'),
];

// Alarm 4: probe was already triggered before the probe cycle started
const PROBE_FAIL_INITIAL: Partial<HelperMessage> = {
    title: tk('helper:alarm.4.title'),
    description: tk('helper:alarm.4.description'),
    steps: PROBE_FAIL_STEPS,
    resource: PROBE_FAIL_RESOURCE,
};

// Alarm 5: probe never detected contact within the expected travel
const PROBE_FAIL_NO_CONTACT: Partial<HelperMessage> = {
    title: tk('helper:alarm.5.title'),
    description: tk('helper:alarm.5.description'),
    steps: PROBE_FAIL_STEPS,
    resource: PROBE_FAIL_RESOURCE,
};

// Shared source for the homing-fail blurbs (alarm 6, 8 & 9)
const HOMING_FAIL_RESOURCE: HelperResource = {
    label: tk('helper:resources.homingFail'),
    url: 'https://sienci.zendesk.com/hc/en-us/articles/52198124311700-Alarm-6-Alarm-8-Alarm-9',
};

const HOMING_FAIL_STEPS = [
    tk('helper:alarm.homingFail.steps.0'),
    tk('helper:alarm.homingFail.steps.1'),
    tk('helper:alarm.homingFail.steps.2'),
    tk('helper:alarm.homingFail.steps.3'),
];

// Alarm 6: the active homing cycle was reset before it finished
const HOMING_FAIL_RESET: Partial<HelperMessage> = {
    title: tk('helper:alarm.6.title'),
    description: tk('helper:alarm.6.description'),
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 8: pull-off move didn't travel far enough to clear the limit switch
const HOMING_FAIL_PULLOFF: Partial<HelperMessage> = {
    title: tk('helper:alarm.8.title'),
    description: tk('helper:alarm.8.description'),
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 9: no limit switch was found within the expected search distance
const HOMING_FAIL_NOT_FOUND: Partial<HelperMessage> = {
    title: tk('helper:alarm.9.title'),
    description: tk('helper:alarm.9.description'),
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 7: homing stopped because the controller thinks the safety door is open
const SAFETY_DOOR: Partial<HelperMessage> = {
    title: tk('helper:alarm.7.title'),
    description: tk('helper:alarm.7.description'),
    steps: [
        tk('helper:alarm.7.steps.0'),
        tk('helper:alarm.7.steps.1'),
        tk('helper:alarm.7.steps.2'),
    ],
    resource: {
        label: tk('helper:resources.safetyDoor'),
        url: 'https://sienci.zendesk.com/hc/en-us/articles/44255990003220-Safety-Door-Triggering',
    },
};

// Alarm 10 (grblHAL only): E-stop signal is active, so the controller stays locked
const ESTOP: Partial<HelperMessage> = {
    title: tk('helper:alarm.10.title'),
    description: tk('helper:alarm.10.description'),
    steps: [
        tk('helper:alarm.10.steps.0'),
        tk('helper:alarm.10.steps.1'),
        tk('helper:alarm.10.steps.2'),
        tk('helper:alarm.10.steps.3'),
    ],
    resource: {
        label: tk('helper:resources.estop'),
        url: 'https://sienci.zendesk.com/hc/en-us/articles/38521862492052-Alarm-10-E-stop',
    },
};

// Shared source for alarm 14 (older firmware) & 19 (newer firmware) — same spindle/VFD comms failure
const SPINDLE_COMMS_RESOURCE: HelperResource = {
    label: tk('helper:resources.spindleComms'),
    url: 'https://sienci.zendesk.com/hc/en-us/articles/34779231810964',
};

const SPINDLE_COMMS_TIMEOUT: Partial<HelperMessage> = {
    title: tk('helper:alarm.spindleComms.title'),
    description: tk('helper:alarm.spindleComms.description'),
    steps: [
        tk('helper:alarm.spindleComms.steps.0'),
        tk('helper:alarm.spindleComms.steps.1'),
        tk('helper:alarm.spindleComms.steps.2'),
        tk('helper:alarm.spindleComms.steps.3'),
        tk('helper:alarm.spindleComms.steps.4'),
    ],
    resource: SPINDLE_COMMS_RESOURCE,
};

// Alarm 17 (grblHAL only): closed-loop stepper motor stalled/faulted
const MOTOR_FAULT: Partial<HelperMessage> = {
    title: tk('helper:alarm.17.title'),
    description: tk('helper:alarm.17.description'),
    steps: [
        tk('helper:alarm.17.steps.0'),
        tk('helper:alarm.17.steps.1'),
        tk('helper:alarm.17.steps.2'),
    ],
    resource: {
        label: tk('helper:resources.motorFault'),
        url: 'https://sienci.zendesk.com/hc/en-us/articles/36090373125396',
    },
};

// Alarm 18 (grblHAL only): homing cycle couldn't complete due to its pass configuration
const HOMING_PASS_MISCONFIGURED: Partial<HelperMessage> = {
    title: tk('helper:alarm.18.title'),
    description: tk('helper:alarm.18.description'),
    steps: [
        tk('helper:alarm.18.steps.0'),
        tk('helper:alarm.18.steps.1'),
        tk('helper:alarm.18.steps.2'),
        tk('helper:alarm.18.steps.3'),
    ],
    resource: {
        label: tk('helper:resources.alarm18'),
        url: 'https://sienci.zendesk.com/hc/en-us/articles/53865590331924-Alarm-18',
    },
};

// Alarm 20 (grblHAL only): ATC spindle's I/O expander backpack isn't communicating
const IO_EXPANDER_FAIL: Partial<HelperMessage> = {
    title: tk('helper:alarm.20.title'),
    description: tk('helper:alarm.20.description'),
    steps: [
        tk('helper:alarm.20.steps.0'),
        tk('helper:alarm.20.steps.1'),
        tk('helper:alarm.20.steps.2'),
    ],
    resource: {
        label: tk('helper:resources.alarm20'),
        url: 'https://sienci.zendesk.com/hc/en-us/articles/53897401277588-Alarm-20',
    },
};

// Extra content per alarm/error, merged over the controller's own text one
// field at a time (so an entry can add only a `resource` or `steps`).
// Strings may be tk() keys or plain text; normalize translates keys.
// Keys are `${kind}:${code}`, e.g. 'alarm:9'. A controller-specific key such
// as 'grblhal:alarm:9' is checked first.
export const HELPER_REGISTRY: Record<string, Partial<HelperMessage>> = {
    // grbl's literal code; grblHAL's alarm table carries it too
    'alarm:Homing': HOMING_REQUIRED,
    // grblHAL only: grbl's numeric alarms stop at 9
    'grblhal:alarm:11': HOMING_REQUIRED,
    // shared by grbl and grblHAL (base ALARMS table)
    'alarm:1': HARD_LIMIT,
    'alarm:2': SOFT_LIMIT,
    'alarm:4': PROBE_FAIL_INITIAL,
    'alarm:5': PROBE_FAIL_NO_CONTACT,
    'alarm:6': HOMING_FAIL_RESET,
    'alarm:7': SAFETY_DOOR,
    'alarm:8': HOMING_FAIL_PULLOFF,
    'alarm:9': HOMING_FAIL_NOT_FOUND,
    // grblHAL only: codes above 9 aren't part of grbl's base alarm table
    'grblhal:alarm:10': ESTOP,
    'grblhal:alarm:14': SPINDLE_COMMS_TIMEOUT,
    'grblhal:alarm:17': MOTOR_FAULT,
    'grblhal:alarm:18': HOMING_PASS_MISCONFIGURED,
    'grblhal:alarm:19': SPINDLE_COMMS_TIMEOUT,
    'grblhal:alarm:20': IO_EXPANDER_FAIL,
};

// Resource shown when neither the payload nor the registry provides one
export const DEFAULT_RESOURCES: Partial<Record<HelperKind, HelperResource>> = {
    alarm: {
        label: tk('helper:resources.alarmCodes'),
        url: 'https://resources.sienci.com/view/gs-gsender-grbl-alarm-error-codes/#alarms',
    },
};
