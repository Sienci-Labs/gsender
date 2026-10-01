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

// Shared source for both the hard and soft limit blurbs below
const LIMIT_ALARM_RESOURCE: HelperResource = {
    label: 'Alarm 1 & 2: Hard & soft limits',
    url: 'https://sienci.zendesk.com/hc/en-us/articles/41566952133524-Alarm-1-Alarm-2',
};

// Alarm 1: a physical limit switch was triggered — machine position may be lost
const HARD_LIMIT: Partial<HelperMessage> = {
    title: 'Hard limit triggered',
    description:
        "A limit switch was triggered, so the machine stopped immediately to protect itself. This usually happens when a move takes the machine past its physical travel, so the machine's exact position may now be lost.",
    steps: [
        'Clear the alarm, then home the machine so gSender can re-establish a known position.',
        "Check that your firmware's travel settings (Config ➜ Homing/Limits) match your machine's actual dimensions.",
        'If this keeps happening during jogging, try smaller jog increments. While surfacing, you can temporarily disable hard limits in Config ➜ Homing/Limits.',
    ],
    resource: LIMIT_ALARM_RESOURCE,
};

// Alarm 2: a commanded move would exceed firmware travel limits — position retained
const SOFT_LIMIT: Partial<HelperMessage> = {
    title: 'Soft limit triggered',
    description:
        "The requested move would have taken the machine past the travel limits set in its firmware. Machine position is retained, so it's safe to unlock and continue.",
    steps: [
        'Unlock the alarm — machine position is not lost.',
        "Check that your job's origin and stock placement match your physical zero point, and that the file's units (mm/in) match your machine.",
        "Verify your firmware's travel settings (Config ➜ Homing/Limits) match your machine's actual dimensions.",
    ],
    resource: LIMIT_ALARM_RESOURCE,
};

// Shared source for the probe-fail blurbs (alarm 4 & 5)
const PROBE_FAIL_RESOURCE: HelperResource = {
    label: 'Alarm 4 & 5: Probe fail',
    url: 'https://sienci.zendesk.com/hc/en-us/articles/52195910796052-Alarm-4-Alarm-5',
};

const PROBE_FAIL_STEPS = [
    'Start probing from about 1/2" (5mm) above the touch plate, positioned over the inner square (AutoZero plates) or the logo (standard plates).',
    'If the probe reads as triggered the instant the cycle starts, even with nothing touching it, the probe input is likely inverted: in Config ➜ Probe, toggle "Invert Probe Inputs ($6)" for the Toolsetter, apply settings, then power cycle the controller.',
];

// Alarm 4: probe was already triggered before the probe cycle started
const PROBE_FAIL_INITIAL: Partial<HelperMessage> = {
    title: 'Probe fail — already triggered',
    description:
        "The probe circuit read as triggered before the probing cycle even started, so gSender can't tell when the tool actually touches the plate.",
    steps: PROBE_FAIL_STEPS,
    resource: PROBE_FAIL_RESOURCE,
};

// Alarm 5: probe never detected contact within the expected travel
const PROBE_FAIL_NO_CONTACT: Partial<HelperMessage> = {
    title: 'Probe fail — no contact detected',
    description:
        "The probe didn't detect contact with the touch plate within the expected travel distance.",
    steps: PROBE_FAIL_STEPS,
    resource: PROBE_FAIL_RESOURCE,
};

// Shared source for the homing-fail blurbs (alarm 6, 8 & 9)
const HOMING_FAIL_RESOURCE: HelperResource = {
    label: 'Alarm 6, 8 & 9: Homing fail',
    url: 'https://sienci.zendesk.com/hc/en-us/articles/52198124311700-Alarm-6-Alarm-8-Alarm-9',
};

const HOMING_FAIL_STEPS = [
    'Check that couplers are tightly attached to both the motor shafts and the ballscrews/leadscrews on every axis.',
    'Make sure each limit switch is firmly mounted and fully seated against its bump stop.',
    'In Config ➜ Homing/Limits, confirm your machine profile matches your CNC model, and reset any yellow-highlighted (non-default) homing settings with the circular reset button.',
    'Apply settings and power cycle the controller.',
];

// Alarm 6: the active homing cycle was reset before it finished
const HOMING_FAIL_RESET: Partial<HelperMessage> = {
    title: 'Homing fail — cycle reset',
    description: 'The active homing cycle was reset before it could finish.',
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 8: pull-off move didn't travel far enough to clear the limit switch
const HOMING_FAIL_PULLOFF: Partial<HelperMessage> = {
    title: 'Homing fail — pull-off did not clear switch',
    description:
        "After homing, the pull-off move didn't travel far enough to release the limit switch.",
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 9: no limit switch was found within the expected search distance
const HOMING_FAIL_NOT_FOUND: Partial<HelperMessage> = {
    title: 'Homing fail — limit switch not found',
    description:
        "The machine couldn't find a limit switch within the expected search distance.",
    steps: HOMING_FAIL_STEPS,
    resource: HOMING_FAIL_RESOURCE,
};

// Alarm 7: homing stopped because the controller thinks the safety door is open
const SAFETY_DOOR: Partial<HelperMessage> = {
    title: 'Homing fail — safety door open',
    description:
        'The controller thinks the safety door is open, so it stopped the homing cycle. On SLB/SLB-EXT controllers this can happen even with nothing plugged into the DOOR input, if the door setting got inverted.',
    steps: [
        'If nothing is connected to the DOOR input, bridge the two door pins with a jumper wire to simulate a closed door.',
        'Enter $RST=$ into the console and run it to reset the inverted setting.',
        'Power cycle the controller.',
    ],
    resource: {
        label: 'Safety door triggering',
        url: 'https://sienci.zendesk.com/hc/en-us/articles/44255990003220-Safety-Door-Triggering',
    },
};

// Alarm 10 (grblHAL only): E-stop signal is active, so the controller stays locked
const ESTOP: Partial<HelperMessage> = {
    title: 'E-stop engaged',
    description:
        'The controller sees the E-stop signal as active, so it stays locked until the E-stop circuit is clear.',
    steps: [
        'Press the E-stop button in, then twist it clockwise to release it, and click "Click to Unlock Machine". Do this every time you connect.',
        "If the alarm persists, check the Console for motor error warnings, and confirm the blue relay light on the SLB-EXT turns on after the E-stop releases — if it doesn't, a motor short may be holding it tripped. Try unplugging a connected Vortex spindle to test.",
        'Short the E-stop bypass pins on the control board: if the red HALT LED goes out, the board is fine and the E-stop button itself needs replacing.',
        "Check the E-stop wiring and both red LEDs on the button — loose connections or LEDs that don't light or clear correctly mean the button should be replaced.",
    ],
    resource: {
        label: 'Alarm 10: E-stop',
        url: 'https://sienci.zendesk.com/hc/en-us/articles/38521862492052-Alarm-10-E-stop',
    },
};

// Shared source for alarm 14 (older firmware) & 19 (newer firmware) — same spindle/VFD comms failure
const SPINDLE_COMMS_RESOURCE: HelperResource = {
    label: 'Alarm 14 & 19: Spindle communication',
    url: 'https://sienci.zendesk.com/hc/en-us/articles/34779231810964',
};

const SPINDLE_COMMS_TIMEOUT: Partial<HelperMessage> = {
    title: 'Spindle communication timeout',
    description:
        'The controller lost communication with the spindle VFD. This shows as alarm 14 on older firmware, or alarm 19 on newer firmware, AltMill 4x8, SLB Lite, and SLB-EXT V2.0.',
    steps: [
        'Power on the spindle/VFD first, then the controller — this lets the two handshake correctly.',
        'Check the RS485 communication LEDs: both RX and TX should flash. If only one (or neither) does, check the cable and connections.',
        "Run the AltMill or LongMill setup file through gSender to restore the VFD's EEPROM values to factory defaults.",
        'Confirm the RS485 cable is in the correct port above the power switch, red wire to RS485- and black to RS485+ at the VFD.',
        'Check the VFD function codes against the parameter table, especially the communication address (F163) and mode (F165).',
    ],
    resource: SPINDLE_COMMS_RESOURCE,
};

// Alarm 17 (grblHAL only): closed-loop stepper motor stalled/faulted
const MOTOR_FAULT: Partial<HelperMessage> = {
    title: 'Motor fault',
    description:
        'A closed-loop stepper motor has halted — usually from stalling during startup, homing, or jogging, mechanical binding, a wiring issue, or a limit switch problem. Check the console for a "Motor Error" warning, and look for a flashing red LED on the motor or a lit stall (STL) light on the control board to see which axis is affected.',
    steps: [
        "Disable hard limits and check limit switch sensors — don't use the integrated bump stop on the Z-axis; adjust sensors so the red indicator lights, then back off about 1/4 turn.",
        'With the controller off, check motor coupler tightness and manually rotate each ball screw — it should turn freely, with no binding in the linear guides or ball screw bearing.',
        "Check motor cable wiring (watch for a flashing vs. solid/no LED), and if the controller's blue relay light stays off at startup, unplug motors one at a time to isolate the faulty one.",
    ],
    resource: {
        label: 'Alarm 17: Motor fault',
        url: 'https://sienci.zendesk.com/hc/en-us/articles/36090373125396',
    },
};

// Alarm 18 (grblHAL only): homing cycle couldn't complete due to its pass configuration
const HOMING_PASS_MISCONFIGURED: Partial<HelperMessage> = {
    title: 'Homing fail — homing passes misconfigured',
    description:
        "The homing cycle couldn't complete because of how the axis homing passes are configured.",
    steps: [
        'In Config ➜ Homing/Limits, confirm your machine profile matches your CNC model.',
        "Review the four axis homing pass settings ($44-$47) — leave these at default unless you're using custom limit switches.",
        'Reset any settings highlighted in yellow back to default with the circular reset button.',
        'Apply settings and power cycle the controller.',
    ],
    resource: {
        label: 'Alarm 18',
        url: 'https://sienci.zendesk.com/hc/en-us/articles/53865590331924-Alarm-18',
    },
};

// Alarm 20 (grblHAL only): ATC spindle's I/O expander backpack isn't communicating
const IO_EXPANDER_FAIL: Partial<HelperMessage> = {
    title: 'I/O expander communication failed',
    description:
        "The controller can't communicate with the I/O expander on the ATC backpack (the pre-assembled component on an ATC spindle).",
    steps: [
        'Check that the ATC backpack is plugged in correctly and fully seated.',
        'Inspect the backpack for physical damage or signs of failure.',
        'If the connection looks secure and undamaged, contact Sienci Labs support (sienci.com/contact-us) for further troubleshooting or a replacement.',
    ],
    resource: {
        label: 'Alarm 20',
        url: 'https://sienci.zendesk.com/hc/en-us/articles/53897401277588-Alarm-20',
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
        label: 'Alarm & error codes',
        url: 'https://resources.sienci.com/view/gs-gsender-grbl-alarm-error-codes/#alarms',
    },
};
