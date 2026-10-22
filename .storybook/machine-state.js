import { listPorts, setConnectionState } from 'app/store/redux/slices/connection.slice';
import {
  addSpindle,
  clearSpindles,
  updateControllerState,
  updateHasHomed,
  updatePartialControllerSettings,
  updateSenderStatus,
  updateWorkflowState,
} from 'app/store/redux/slices/controller.slice';
import { unloadFileInfo, updateFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import { setInputHistory } from 'app/store/redux/slices/console.slice';
import { setNotifications } from 'app/store/redux/slices/preferences.slice';
import {
  GRBLHAL,
  GRBL_ACTIVE_STATE_ALARM,
  GRBL_ACTIVE_STATE_HOLD,
  GRBL_ACTIVE_STATE_IDLE,
  GRBL_ACTIVE_STATE_RUN,
  METRIC_UNITS,
  WORKFLOW_STATE_IDLE,
  WORKFLOW_STATE_PAUSED,
  WORKFLOW_STATE_RUNNING,
  WORKSPACE_MODE,
} from 'app/constants';

// Presets describe what the controller would report over the socket.
// Stories pick one with `parameters: { machine: { preset: 'idle' } }`.
const PRESETS = {
  disconnected: { isConnected: false },
  idle: {
    isConnected: true,
    activeState: GRBL_ACTIVE_STATE_IDLE,
    workflow: WORKFLOW_STATE_IDLE,
  },
  running: {
    isConnected: true,
    activeState: GRBL_ACTIVE_STATE_RUN,
    workflow: WORKFLOW_STATE_RUNNING,
  },
  hold: {
    isConnected: true,
    activeState: GRBL_ACTIVE_STATE_HOLD,
    workflow: WORKFLOW_STATE_PAUSED,
  },
  alarm: {
    isConnected: true,
    activeState: GRBL_ACTIVE_STATE_ALARM,
    workflow: WORKFLOW_STATE_IDLE,
  },
};

const ORIGIN = { x: 0, y: 0, z: 0, a: 0, b: 0, c: 0 };

// EEPROM values stories may override; listed so each story starts from the same baseline
const DEFAULT_SETTINGS = { $13: '0', $22: '0', $23: '0', $27: '1', $32: '0' };

// The preview shares one Redux store across stories, so every story resets
// it through the same actions the socket listeners dispatch in the app.
export function applyMachineState(
  store,
  {
    preset = 'disconnected',
    type = GRBLHAL,
    modal = {},
    mpos = ORIGIN,
    wpos = mpos,
    axes = ['X', 'Y', 'Z'],
    settings = {},
    hasHomed = false,
    // Extra fields for controller.state.status, e.g. { alarmCode: 1 } or { activeState: 'Door' }
    status = {},
    // grblHAL spindle list, e.g. [{ id: 0, label: 'Spindle', enabled: true, laser: false }]
    spindles = [],
    notifications = [],
    // Loaded G-code file info, e.g. { name: 'part.nc', total: 4000 }; omit for no file
    file,
    // Sender progress while a job runs, e.g. { sent: 1200, total: 4000, remainingTime: 900 }
    sender = null,
    // Serial ports the server lists, e.g. [{ port: '/dev/ttyACM0', manufacturer: 'Arduino', inuse: false }]
    ports = [],
    unrecognizedPorts = [],
    // Commands previously typed into the console (ArrowUp recalls them)
    consoleInputHistory = [],
  } = {},
) {
  const { isConnected, activeState, workflow = WORKFLOW_STATE_IDLE } = PRESETS[preset];

  store.dispatch(setConnectionState({ isConnected }));
  store.dispatch(listPorts({ ports, unrecognizedPorts, networkPorts: [] }));
  store.dispatch(updatePartialControllerSettings({ ...DEFAULT_SETTINGS, ...settings }));
  // The reducer always builds a status object, so give it the full shape the
  // server reports (pinState included) even when disconnected
  store.dispatch(
    updateControllerState({
      type: isConnected ? type : '',
      state: {
        status: {
          activeState,
          mpos: { ...ORIGIN, ...mpos },
          wpos: { ...ORIGIN, ...wpos },
          feedrate: 0,
          pinState: {},
          ...status,
        },
        parserstate: { modal },
        axes: { axes },
      },
    }),
  );
  store.dispatch(updateWorkflowState({ state: workflow }));
  store.dispatch(updateHasHomed({ hasHomed }));
  store.dispatch(clearSpindles());
  spindles.forEach((spindle, order) =>
    store.dispatch(addSpindle({ capabilities: '', raw: '', order, ...spindle })),
  );
  store.dispatch(setNotifications(notifications));
  store.dispatch(unloadFileInfo());
  if (file) store.dispatch(updateFileInfo(file));
  store.dispatch(updateSenderStatus({ status: sender }));
  store.dispatch(setInputHistory(consoleInputHistory));
}

const DEFAULT_WORKSPACE = {
  units: METRIC_UNITS,
  shouldWarnZero: false,
  mode: WORKSPACE_MODE.DEFAULT,
};

let initialAppState;

// app/store holds user preferences (persisted to localStorage outside Electron).
// Each story starts from the state the page loaded with, then applies
// `parameters: { workspace: { units: 'in' } }` and any other key paths via
// `parameters: { appStore: { 'widgets.probe.connectivityTest': false } }`.
export function applyAppState(store, { workspace = {}, appStore = {} } = {}) {
  initialAppState ??= structuredClone(store.state);
  store.state = structuredClone(initialAppState);

  for (const [key, value] of Object.entries({ ...DEFAULT_WORKSPACE, ...workspace })) {
    store.set(`workspace.${key}`, value);
  }
  for (const [path, value] of Object.entries(appStore)) {
    store.set(path, value);
  }
}
