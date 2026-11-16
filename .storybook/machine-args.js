import { GRBL, GRBLHAL, IMPERIAL_UNITS, METRIC_UNITS } from 'app/constants';
import { PRESETS } from './machine-state';

// Feature components take no props: what they show comes from the machine state
// a story declares in `parameters.machine` (see machine-state.js). These
// enhancers expose that state as controls, so any story with machine parameters
// can be switched to another preset, firmware, position or loaded file from the
// Controls panel. Each story's parameters become its initial args, so Reset
// returns to the state the story describes.
//
// The argTypes target 'machine'/'workspace', which keeps them out of the props
// passed to the component; preview.jsx reads them back in beforeEach, which
// Storybook re-runs whenever args change.

const MACHINE = 'machine';
const WORKSPACE = 'workspace';

// arg name -> [target, key in parameters.machine / parameters.workspace, argType, default]
const STATE_ARGS = {
    machinePreset: [
        MACHINE,
        'preset',
        {
            description:
                'What the controller reports: connection, active state and workflow',
            control: { type: 'select' },
            options: Object.keys(PRESETS),
        },
        'disconnected',
    ],
    machineFirmware: [
        MACHINE,
        'type',
        { control: { type: 'inline-radio' }, options: [GRBLHAL, GRBL] },
        GRBLHAL,
    ],
    machineHasHomed: [
        MACHINE,
        'hasHomed',
        {
            description: 'Whether the machine has homed this session',
            control: { type: 'boolean' },
        },
        false,
    ],
    machineAxes: [
        MACHINE,
        'axes',
        {
            description: 'Axes the controller reports',
            control: { type: 'inline-check' },
            options: ['X', 'Y', 'Z', 'A', 'B', 'C'],
        },
        ['X', 'Y', 'Z'],
    ],
    machineMpos: [
        MACHINE,
        'mpos',
        {
            description: 'Machine position, e.g. { x: 120, y: 45, z: -3 }',
            control: { type: 'object' },
        },
    ],
    machineWpos: [
        MACHINE,
        'wpos',
        {
            description: 'Work position; follows machine position when unset',
            control: { type: 'object' },
        },
    ],
    machineModal: [
        MACHINE,
        'modal',
        {
            description:
                'Parser modal state, e.g. { coolant: "M8", spindle: "M3" }',
            control: { type: 'object' },
        },
    ],
    machineStatus: [
        MACHINE,
        'status',
        {
            description:
                'Extra status report fields, e.g. { alarmCode: 1 } or { ov: [120, 100, 90] }',
            control: { type: 'object' },
        },
    ],
    machineFile: [
        MACHINE,
        'file',
        {
            description:
                'Loaded G-code file, e.g. { name: "part.nc", total: 4000 }; unset for none',
            control: { type: 'object' },
        },
    ],
    machineSender: [
        MACHINE,
        'sender',
        {
            description:
                'Job progress, e.g. { sent: 1200, total: 4000, remainingTime: 900 }',
            control: { type: 'object' },
        },
    ],
    workspaceUnits: [
        WORKSPACE,
        'units',
        {
            control: { type: 'inline-radio' },
            options: [METRIC_UNITS, IMPERIAL_UNITS],
        },
        METRIC_UNITS,
    ],
};

const CATEGORIES = { [MACHINE]: 'Machine state', [WORKSPACE]: 'Workspace' };

const hasMachineState = ({ parameters }) => parameters.machine !== undefined;

const stateArgTypes = (context) => {
    if (!hasMachineState(context)) return context.argTypes;
    const argTypes = { ...context.argTypes };
    for (const [name, [target, key, argType, defaultValue]] of Object.entries(
        STATE_ARGS,
    )) {
        argTypes[name] = {
            name,
            target,
            ...argType,
            table: {
                category: CATEGORIES[target],
                ...(defaultValue !== undefined && {
                    defaultValue: { summary: JSON.stringify(defaultValue) },
                }),
            },
            ...context.argTypes[name],
        };
    }
    return argTypes;
};

const stateArgs = (context) => {
    if (!hasMachineState(context)) return {};
    const { parameters, initialArgs } = context;
    const args = {};
    for (const [name, [target, key, , defaultValue]] of Object.entries(
        STATE_ARGS,
    )) {
        // Args a story sets itself (e.g. saved with "Update story") win
        args[name] =
            initialArgs[name] ?? parameters[target]?.[key] ?? defaultValue;
    }
    return args;
};

export const argTypesEnhancers = [stateArgTypes];
export const argsEnhancers = [stateArgs];

// Folds the state args back over the story's parameters. Args are authoritative
// for the keys they cover, so clearing a control (e.g. the file) clears that state.
export function stateFromArgs(parameters, argsByTarget = {}) {
    const state = {
        [MACHINE]: { ...parameters.machine },
        [WORKSPACE]: { ...parameters.workspace },
    };
    for (const [name, [target, key]] of Object.entries(STATE_ARGS)) {
        const args = argsByTarget[target];
        if (!args) continue;
        // Cleared args are dropped from the store; leave the key to its default
        if (args[name] === undefined) delete state[target][key];
        else state[target][key] = args[name];
    }
    return state;
}
