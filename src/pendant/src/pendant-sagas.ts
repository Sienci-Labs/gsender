/**
 * Minimal saga for the pendant: wires socket events → redux store.
 * Covers connection state, machine state/position, port listing, ATCI confirm dialogs.
 * Deliberately omits Electron IPC, visualizer workers, and the keepout-toggle
 * banner (ATCI subtype '10'), which depends on the Helper/WizardProvider machinery.
 */

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import type { WORKFLOW_STATES_T } from 'app/constants';
import type {
    ControllerSettings,
    EEPROMDescriptions,
    FIRMWARE_TYPES_T,
    MachineProfile,
} from 'app/definitions/firmware';
import type { BasicObject } from 'app/definitions/general';
import {
    ACCESSORY_AUTOCONFIG_KEYS,
    type AccessoryAutoconfigKey,
    isAccessoryConnected,
} from 'app/features/AccessoryConnectivity/accessoryAutoconfigKeys';
import { showAccessoryConnectivityToast } from 'app/features/AccessoryConnectivity/showAccessoryConnectivityToast';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import controller from 'app/lib/controller';
import type { TOOL } from 'app/lib/definitions/gcode_virtualization';
import { toast } from 'app/lib/toaster';
import { determineFixedSensorInstructions } from 'app/lib/toolChangeUtils';
import store from 'app/store';
import type { AlarmsData, PortInfo, SDCardFile } from 'app/store/definitions';
import { store as reduxStore } from 'app/store/redux';
import {
    closeConnection,
    listPorts,
    openConnection,
    setConnectionState,
} from 'app/store/redux/slices/connection.slice';
import {
    addSDCardFileToList,
    addSpindle,
    clearSpindles,
    resetHoming,
    updateAlarmDescriptions,
    updateAutoconfig,
    updateControllerSettings,
    updateControllerState,
    updateControllerType,
    updateFeederStatus,
    updateHasHomed,
    updateHomingFlag,
    updateSenderStatus,
    updateSettingsDescriptions,
    updateWorkflowState,
} from 'app/store/redux/slices/controller.slice';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import { setIpList } from 'app/store/redux/slices/preferences.slice';
import type { NetworkAddress } from 'app/store/definitions';
import type { WizardInstructions } from 'app/wizards/definitions';
import manualToolChange from 'app/wizards/manualToolchange';
import semiautoToolChange from 'app/wizards/semiautoToolchange';
import pubsub from 'pubsub-js';
import {
    applyControllerGcodePayload,
    resendCachedEstimateData,
    shouldIgnoreControllerGcodeLoad,
} from './utils/gcodeProcessing';

export function* initialize() {
    // Seeded from [NEWOPT:...] on connect, then kept in sync with live
    // autoconfig updates - the reference the accessory toast diffs against.
    let accessoryBaselineConnected: Partial<
        Record<AccessoryAutoconfigKey, boolean>
    > = {};
    // Once per connection - a repeated $I shouldn't re-raise the warning.
    let atcToolchangeChecked = false;

    // ATC macros only see M6 when gSender passes it through untouched:
    // passthrough on and strategy Ignore. Desktop raises this via helper:info,
    // which the pendant doesn't render, so use a confirm dialog instead.
    const checkAtcToolchangeConfig = (
        newopt: Record<string, string | null>,
    ) => {
        if (atcToolchangeChecked || newopt.ATC !== '1') {
            return;
        }
        atcToolchangeChecked = true;

        const passthroughOff = !store.get(
            'workspace.toolChange.passthrough',
            false,
        );
        const strategy = store.get('workspace.toolChangeOption', 'Ignore');
        const strategyWrong = strategy !== 'Ignore';
        if (!passthroughOff && !strategyWrong) {
            return;
        }

        const problems = [
            passthroughOff &&
                'Passthrough is off, so M6 commands are commented out and never reach the controller.',
            strategyWrong &&
                `Tool change strategy is ${strategy}, so gSender handles tool changes instead of the ATC macros.`,
        ].filter(Boolean);

        Confirm({
            title: 'Controller is set up to handle tool changes',
            content: `Your controller reported an ATC, but gSender's tool change settings will stop the ATC macros from running. ${problems.join(' ')} Update gSender's tool change settings?`,
            confirmLabel:
                passthroughOff && !strategyWrong
                    ? 'Enable passthrough'
                    : 'Update settings',
            cancelLabel: 'Keep current settings',
            onConfirm: () => {
                if (passthroughOff) {
                    store.set('workspace.toolChange.passthrough', true);
                }
                if (strategyWrong) {
                    store.set('workspace.toolChangeOption', 'Ignore');
                }
                updateToolchangeContext();
            },
        });
    };

    // ── Tool change context ────────────────────────────────────────────────
    // Desktop pushes this from FileControl, which the pendant never renders.
    // Without it the server keeps an empty context and comments out every M6.
    store.on('change', () => {
        updateToolchangeContext();
    });

    // ── Machine state ──────────────────────────────────────────────────────
    controller.addListener(
        'controller:settings',
        (type: string, settings: ControllerSettings) => {
            reduxStore.dispatch(updateControllerSettings({ type, settings }));
        },
    );

    controller.addListener(
        'controller:state',
        (type: string, state: any, tool: TOOL) => {
            // Server passes the upcoming tool alongside state during a tool change
            if (tool) {
                state.parserstate.modal.tool = tool;
            }
            reduxStore.dispatch(updateControllerState({ type, state }));
        },
    );

    controller.addListener('workflow:state', (state: WORKFLOW_STATES_T) => {
        reduxStore.dispatch(updateWorkflowState({ state }));
    });

    controller.addListener('feeder:status', (status: any) => {
        reduxStore.dispatch(updateFeederStatus({ status }));
    });

    controller.addListener('sender:status', (status: any) => {
        reduxStore.dispatch(updateSenderStatus({ status }));
    });

    controller.addListener('spindle:add', (spindle: any) => {
        reduxStore.dispatch(addSpindle(spindle));
    });

    // SD Card Manager (Tools page): the server replies to 'sdcard:list' with
    // one 'sdcard:files' event per file. Without this listener the request
    // still round-trips fine (visible server-side), but nothing ever reaches
    // the store the listing reads from, so the UI just stays empty.
    controller.addListener('sdcard:files', (file: SDCardFile) => {
        reduxStore.dispatch(addSDCardFileToList({ file }));
    });

    // Remote File Receive (Tools page): same shape of gap as sdcard:files
    // above - the server replies to 'listAllIps' with 'ip:list', but nothing
    // forwarded it into the store the panel reads addresses from.
    controller.addListener('ip:list', (ipList: NetworkAddress[]) => {
        reduxStore.dispatch(setIpList(ipList));
    });

    // ── Homing state ───────────────────────────────────────────────────────
    controller.addListener('homing:flag', (flag: boolean) => {
        reduxStore.dispatch(updateHomingFlag({ homingFlag: flag }));
    });

    controller.addListener('homing:has-homed', (hasHomed: boolean) => {
        reduxStore.dispatch(updateHasHomed({ hasHomed }));
    });

    // ── Connection lifecycle ───────────────────────────────────────────────
    controller.addListener(
        'serialport:open',
        (options: {
            port: string;
            baudrate: string;
            controllerType: string;
        }) => {
            reduxStore.dispatch(
                openConnection({
                    port: options.port,
                    baudrate: options.baudrate,
                    isConnected: false,
                }),
            );
            reduxStore.dispatch(
                updateControllerType({ type: options.controllerType }),
            );
        },
    );

    controller.addListener(
        'serialport:openController',
        (controllerType: FIRMWARE_TYPES_T) => {
            const machineProfile: MachineProfile = store.get(
                'workspace.machineProfile',
            );
            const showLineWarnings: boolean = store.get(
                'widgets.visualizer.showLineWarnings',
            );
            const delay: number = store.get('widgets.spindle.delay');
            const useAaxisForGrbl: boolean = store.get(
                'workspace.rotaryAxis.useAaxisForGrbl',
                false,
            );
            reduxStore.dispatch(clearSpindles());

            if (machineProfile) {
                controller.command('machineprofile:load', machineProfile);
            }
            if (showLineWarnings) {
                controller.command('settings:updated', { showLineWarnings });
            }
            if (delay !== undefined) {
                controller.command('settings:updated', { spindleDelay: delay });
            }
            controller.command('settings:updated', { useAaxisForGrbl });

            store.set('widgets.connection.controller.type', controllerType);
            reduxStore.dispatch(updateControllerType({ type: controllerType }));
            // Commands are dropped while disconnected, so resend on every connect
            updateToolchangeContext();
            // Reset homing run flag to prevent rapid position without running homing
            reduxStore.dispatch(resetHoming());
            setTimeout(() => {
                reduxStore.dispatch(setConnectionState({ isConnected: true }));
            }, 300);
        },
    );

    controller.addListener('serialport:close', () => {
        reduxStore.dispatch(clearSpindles());
        reduxStore.dispatch(resetHoming());
        reduxStore.dispatch(closeConnection());
        // So a reconnect re-baselines cleanly from the next $I/NEWOPT response.
        accessoryBaselineConnected = {};
        atcToolchangeChecked = false;
    });

    controller.addListener('serialport:closeController', () => {
        reduxStore.dispatch(closeConnection());
    });

    // ── Port discovery (populates the Connection widget dropdown) ──────────
    controller.addListener(
        'serialport:list',
        (
            ports: PortInfo[],
            unrecognizedPorts: PortInfo[],
            networkPorts: PortInfo[],
        ) => {
            reduxStore.dispatch(
                listPorts({ ports, unrecognizedPorts, networkPorts }),
            );
        },
    );

    // ── File load/unload (feeds the SVG visualizer) ────────────────────────
    controller.addListener('gcode:load', (name: string, content: string) => {
        const size = new Blob([content]).size;
        const payload = { content, size, name };
        if (shouldIgnoreControllerGcodeLoad(payload)) {
            return;
        }
        void applyControllerGcodePayload(payload);
    });

    controller.addListener(
        'file:load',
        (content: string, size: number, name: string) => {
            const payload = { content, size, name };
            if (shouldIgnoreControllerGcodeLoad(payload)) {
                return;
            }
            void applyControllerGcodePayload(payload);
        },
    );

    controller.addListener('gcode:unload', () => {
        reduxStore.dispatch(unloadFileInfo());
    });

    // Server asks for this when it needs a client to (re-)send its per-line
    // time estimate (e.g. another client connects, or sender state resets).
    controller.addListener('requestEstimateData', () => {
        resendCachedEstimateData();
    });

    // ── ATC macro dialogs ───────────────────────────────────────────────────
    controller.addListener(
        'atci',
        (payload: {
            subtype: string;
            message: string;
            description: string;
        }) => {
            if (payload.subtype === '0') {
                Confirm({
                    title: payload.message,
                    content: payload.description,
                    confirmLabel: 'Resume',
                    cancelLabel: 'Reset',
                    onConfirm: () => controller.command('cyclestart'),
                    onClose: () => controller.command('reset'),
                });
            } else if (payload.subtype === '1') {
                Confirm({
                    title: payload.message,
                    content: payload.description,
                    confirmLabel: 'OK',
                    cancelLabel: 'Reset',
                    onConfirm: () => controller.command('cyclestart'),
                    hideClose: true,
                });
            } else if (payload.subtype === '2') {
                Confirm({
                    title: payload.message,
                    content: payload.description,
                    confirmLabel: 'Reset',
                    onConfirm: () => controller.command('reset'),
                    hideClose: true,
                });
            } else {
                Confirm({
                    title: 'ATC requested a dialog.',
                    content: 'Continue to unhold, Reset to stop action.',
                    confirmLabel: 'Continue',
                    cancelLabel: 'Reset',
                });
            }
        },
    );

    // ── Tool change flow ────────────────────────────────────────────────────
    // gSender-driven strategies: build the wizard and hand it to WizardBridge
    // via wizard:load.
    controller.addListener(
        'gcode:toolChange',
        async (context: BasicObject, comment = '') => {
            const skipDialog = store.get(
                'workspace.toolChange.skipDialog',
                false,
            );

            const { option, count } = context;
            if (option === 'Pause') {
                const msg = `Toolchange pause${comment ? ` - ${comment}` : ''}`;
                if (!skipDialog) {
                    toast.info(msg, { position: 'bottom-right' });
                }
                return;
            }

            let title: string;
            let instructions: WizardInstructions;
            if (option === 'Standard Re-zero') {
                title = 'Standard Re-zero Tool Change';
                instructions = manualToolChange;
            } else if (option === 'Flexible Re-zero') {
                title = 'Flexible Re-zero Tool Change';
                instructions = semiautoToolChange(count as number);
            } else if (option === 'Fixed Tool Sensor') {
                title = 'Fixed Tool Sensor Tool Change';
                instructions = await determineFixedSensorInstructions(
                    count as number,
                    comment,
                );
            } else {
                console.error('Invalid toolchange option passed');
                return;
            }

            if (instructions.onStart) {
                controller.command('wizard:start', instructions.onStart());
            }

            pubsub.publish('wizard:load', {
                context,
                comment,
                title,
                instructions,
            });
        },
    );

    controller.addListener(
        'wizard:next',
        (stepIndex: number, substepIndex: number) => {
            pubsub.publish('wizard:next', { stepIndex, substepIndex });
        },
    );

    // Code strategy: pre-hook ran, confirm before running the post-hook
    controller.addListener('toolchange:preHookComplete', (comment = '') => {
        const msg =
            'A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.';
        Confirm({
            title: 'Confirm Toolchange',
            content: comment.length > 0 ? `${msg} Comment: ${comment}` : msg,
            confirmLabel: 'Confirm toolchange',
            onConfirm: () => controller.command('toolchange:post'),
        });
    });

    // ── Program pauses ─────────────────────────────────────────────────────
    controller.addListener(
        'feeder:pause',
        (payload: { data: string; comment: string }) => {
            const msg = 'Press Resume to continue.';
            Confirm({
                title: `${payload.data} pause detected`,
                content:
                    payload.comment.length > 0
                        ? `${msg} Comment: ${payload.comment}`
                        : msg,
                confirmLabel: 'Resume',
                cancelLabel: 'Stop',
                onConfirm: () => controller.command('feeder:start'),
                onClose: () => controller.command('feeder:stop'),
            });
        },
    );

    controller.addListener(
        'sender:M0M1',
        (opts: { comment: string; ignoreEvent: boolean }) => {
            const { comment = '', ignoreEvent = false } = opts;
            const msg =
                'Hit ‘Close Window‘ if you want to do a tool change, jog, set a new zero, or perform any other operation then hit the standard ‘Resume Job’ button to keep cutting when you’re ready.';
            Confirm({
                title: 'M0/M1 Pause',
                content:
                    comment.length > 0 ? `${msg} Comment: ${comment}` : msg,
                confirmLabel: 'Resume Job',
                cancelLabel: 'Close Window',
                onConfirm: () =>
                    controller.command('gcode:resume', ignoreEvent),
            });
        },
    );

    controller.addListener('workflow:pause', (opts: { data: string }) => {
        toast.info(
            `'${opts.data}' pause command found in file - press "Resume Job" to continue running.`,
            { position: 'bottom-right' },
        );
    });

    // ── Controller info / descriptions ─────────────────────────────────────
    controller.addListener(
        'settings:description',
        (data: EEPROMDescriptions) => {
            reduxStore.dispatch(
                updateSettingsDescriptions({ descriptions: data }),
            );
        },
    );

    controller.addListener('settings:alarms', (data: AlarmsData) => {
        reduxStore.dispatch(updateAlarmDescriptions({ alarms: data }));
    });

    controller.addListener(
        'grblHal:info',
        (payload: { name: string; value: unknown }) => {
            if (
                payload.name !== 'NEWOPT' ||
                typeof payload.value !== 'object' ||
                !payload.value
            ) {
                return;
            }

            const newopt = payload.value as Record<string, string | null>;
            const accessoryValues: Record<string, string> = {};
            ACCESSORY_AUTOCONFIG_KEYS.forEach((key) => {
                if (key in newopt) {
                    accessoryBaselineConnected[key] = isAccessoryConnected(
                        newopt[key],
                    );
                    accessoryValues[key] = newopt[key] ?? '0';
                }
            });

            if (Object.keys(accessoryValues).length > 0) {
                reduxStore.dispatch(
                    updateAutoconfig({ values: accessoryValues }),
                );
            }

            checkAtcToolchangeConfig(newopt);
        },
    );

    controller.addListener(
        'grblHal:autoconfig',
        (payload: { values: Record<string, string> }) => {
            Object.entries(payload.values).forEach(([key, value]) => {
                if (
                    !ACCESSORY_AUTOCONFIG_KEYS.includes(
                        key as AccessoryAutoconfigKey,
                    )
                ) {
                    return;
                }

                const nowConnected = isAccessoryConnected(value);
                const previouslyConnected =
                    accessoryBaselineConnected[key as AccessoryAutoconfigKey];
                if (
                    previouslyConnected !== undefined &&
                    previouslyConnected !== nowConnected
                ) {
                    showAccessoryConnectivityToast(
                        key,
                        nowConnected ? 'connected' : 'disconnected',
                    );
                }
                accessoryBaselineConnected[key as AccessoryAutoconfigKey] =
                    nowConnected;
            });

            reduxStore.dispatch(updateAutoconfig(payload));
        },
    );
}
