import { expect, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import rootSaga, { sagaMiddleware } from 'app/store/redux/sagas';
import { VISUALIZER_PRIMARY } from 'app/constants';

import Visualizer from './index';

// App.tsx starts the controller sagas, which turn the server's file:load event into
// a parse in the Visualize worker. Start them once for this page.
let sagasStarted = false;
const startSagas = () => {
  if (!sagasStarted) {
    sagaMiddleware.run(rootSaga);
    sagasStarted = true;
  }
};

// A 50 x 30 mm rectangle cut 2 mm deep
const GCODE = [
  'G21 G90',
  'G0 Z5',
  'G0 X0 Y0',
  'G1 Z-2 F300',
  'G1 X50 Y0 F1200',
  'G1 X50 Y30',
  'G1 X0 Y30',
  'G1 X0 Y0',
  'G0 Z5',
  'M30',
].join('\n');

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) => {
  controller.listeners[eventName].forEach((listener) => listener(...args));
};

const loadFile = (name = 'rectangle.nc') =>
  emit('file:load', GCODE, new Blob([GCODE]).size, name, VISUALIZER_PRIMARY);

const fileState = () => reduxStore.getState().file;

const meta = {
  component: Visualizer,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  beforeEach: startSagas,
  decorators: [
    (Story) => (
      <div className="relative h-[560px] w-[900px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const EmptyScene = {
  play: async ({ canvas, canvasElement }) => {
    // three.js draws into a WebGL canvas
    await waitFor(() => expect(canvasElement.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByRole('button', { name: '3D view' })).toBeVisible();
  },
};

export const CameraViews = {
  play: async ({ canvas, userEvent }) => {
    // The camera widget titles itself with the current view
    await userEvent.click(canvas.getByRole('button', { name: 'Top view' }));
    await expect(canvas.getByRole('heading', { name: 'Top' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Front view' }));
    await expect(canvas.getByRole('heading', { name: 'Front' })).toBeVisible();
  },
};

export const LoadFile = {
  play: async () => {
    loadFile();
    // The Visualize worker parses the file and reports its extents
    await waitFor(() => expect(fileState().fileLoaded).toBe(true), { timeout: 5000 });
    await expect(fileState().name).toBe('rectangle.nc');
    // Extents arrive after the parse finishes, a moment after the file is marked loaded
    await waitFor(
      () =>
        expect(fileState().bbox).toMatchObject({
          min: { x: 0, y: 0, z: -2 },
          max: { x: 50, y: 30, z: 5 },
        }),
      { timeout: 5000 },
    );
  },
};

export const RenderStateAfterLoad = {
  play: async () => {
    loadFile('probe-render-state.nc');
    await waitFor(() => expect(fileState().fileLoaded).toBe(true), { timeout: 5000 });
    await waitFor(() => expect(fileState().renderState).toBe('RENDER_RENDERED'), { timeout: 5000 });
  },
};
