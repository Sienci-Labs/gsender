import {
  setConnectionState,
} from 'app/store/redux/slices/connection.slice';
import {
  updateControllerState,
  updateHasHomed,
  updatePartialControllerSettings,
  updateWorkflowState,
} from 'app/store/redux/slices/controller.slice';
import {
  GRBLHAL,
  GRBL_ACTIVE_STATE_ALARM,
  GRBL_ACTIVE_STATE_IDLE,
  GRBL_ACTIVE_STATE_RUN,
  METRIC_UNITS,
  WORKFLOW_STATE_IDLE,
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
  alarm: {
    isConnected: true,
    activeState: GRBL_ACTIVE_STATE_ALARM,
    workflow: WORKFLOW_STATE_IDLE,
  },
};

const ORIGIN = { x: 0, y: 0, z: 0, a: 0, b: 0, c: 0 };

// EEPROM values stories may override; listed so each story starts from the same baseline
const DEFAULT_SETTINGS = { $22: '0', $23: '0', $27: '1' };

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
  } = {},
) {
  const { isConnected, activeState, workflow = WORKFLOW_STATE_IDLE } = PRESETS[preset];

  store.dispatch(setConnectionState({ isConnected }));
  store.dispatch(updatePartialControllerSettings({ ...DEFAULT_SETTINGS, ...settings }));
  store.dispatch(
    updateControllerState({
      type: isConnected ? type : '',
      state: isConnected
        ? {
            status: { activeState, mpos: { ...ORIGIN, ...mpos }, wpos: { ...ORIGIN, ...wpos }, feedrate: 0 },
            parserstate: { modal },
            axes: { axes },
          }
        : {},
    }),
  );
  store.dispatch(updateWorkflowState({ state: workflow }));
  store.dispatch(updateHasHomed({ hasHomed }));
}

const DEFAULT_WORKSPACE = {
  units: METRIC_UNITS,
  shouldWarnZero: false,
  mode: WORKSPACE_MODE.DEFAULT,
};

// Workspace preferences live in app/store (persisted to localStorage outside Electron).
// Stories override them with `parameters: { workspace: { units: 'in' } }`.
export function applyWorkspaceState(store, workspace = {}) {
  for (const [key, value] of Object.entries({ ...DEFAULT_WORKSPACE, ...workspace })) {
    store.set(`workspace.${key}`, value);
  }
}
