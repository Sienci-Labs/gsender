import { http, HttpResponse } from 'msw';
import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    DRAWER_EXPANDED,
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import MacrosPanel from './MacrosPanel';

const MACROS = [
    {
        id: 'm1',
        name: 'Probe Z',
        content: 'G38.2 Z-25 F100\nG10 L20 P0 Z0',
        description: 'Probe and zero Z',
        column: 'column1',
        rowIndex: 0,
    },
    {
        id: 'm2',
        name: 'Park',
        content: 'G53 G0 Z-5\nG53 G0 X-5 Y-5',
        description: '',
        column: 'column1',
        rowIndex: 1,
    },
    {
        id: 'm3',
        name: 'Dust Collector On',
        content: 'M8',
        description: '',
        column: 'column2',
        rowIndex: 0,
    },
];

// Macros are read from the server's /api/macros, as the desktop widget does
const withMacros =
    (macros) =>
    ({ msw }) => {
        msw.use(
            http.get('*/api/macros', () =>
                HttpResponse.json({ records: macros }),
            ),
            http.put('*/api/macros/:id', () => HttpResponse.json({})),
        );
    };

// Mirrors app/src/features/Macros/Macros.stories.jsx. The pendant's macros tab
// (legacy bottom drawer and the carve screen's Setup > Macros tab)
const meta = {
    title: 'Pendant/MacrosPanel',
    component: MacrosPanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: { width: LEGACY.width, height: DRAWER_EXPANDED },
        machine: { preset: 'idle' },
    },
    beforeEach: withMacros(MACROS),
    args: { mode: 'expanded' },
    argTypes: {
        mode: {
            description:
                'Bottom drawer height: minimal shows a single row, expanded adds Add / Import / Export',
            control: { type: 'inline-radio' },
            options: ['minimal', 'expanded'],
        },
    },
};

export default meta;

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        await userEvent.click(await canvas.findByText('Probe Z'));
        await expect(command).toHaveBeenCalledWith('macro:run', 'm1', {});
    },
};

export const Minimal = {
    args: { mode: 'minimal' },
    parameters: { pendant: { width: LEGACY.width, height: DRAWER_MINIMAL } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Add')).toBeVisible();
    },
};

export const Empty = {
    beforeEach: withMacros([]),
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('No macros yet')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('Probe Z')).toBeVisible();
    },
};

export const AddMacro = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(canvas.getByText('Add'));
        // The add dialog portals to document.body
        await expect(
            await within(canvasElement.ownerDocument.body).findByRole('dialog'),
        ).toBeVisible();
    },
};
