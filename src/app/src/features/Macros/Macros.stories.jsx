import { expect, spyOn, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import controller from 'app/lib/controller';

import MacroWidget from './index';

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

// Serve the macro list the widget fetches on mount. Macro.tsx also PUTs every
// macro back (column/rowIndex) whenever its columns are recomputed, including on load.
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

// dnd-kit wraps each macro in a sortable role="button" with the same name,
// so pick the native run button inside it
const findMacroButton = async (canvas, name) =>
    (await canvas.findAllByRole('button', { name })).find(
        (el) => el.tagName === 'BUTTON',
    );

const meta = {
    component: MacroWidget,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    beforeEach: withMacros(MACROS),
    decorators: [
        (Story) => (
            <div className="h-72 w-[460px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(await findMacroButton(canvas, 'Probe Z'));
        await expect(command).toHaveBeenCalledWith(
            'macro:run',
            'm1',
            controller.context,
            expect.any(Function),
        );
    },
};

export const Empty = {
    beforeEach: withMacros([]),
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('No Macros...')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(await findMacroButton(canvas, 'Probe Z')).toBeDisabled();
    },
};

export const AddMacro = {
    play: async ({ canvas, canvasElement, userEvent, msw }) => {
        const created = {
            id: 'm4',
            name: 'Tool Change',
            content: 'M0',
            description: '',
            column: 'column2',
            rowIndex: 1,
        };
        let posted;
        msw.use(
            http.post('*/api/macros', async ({ request }) => {
                posted = await request.json();
                return HttpResponse.json({ macro: created });
            }),
        );

        await userEvent.click(canvas.getByRole('button', { name: /Add/ }));
        // MacroForm renders in a dialog portalled to document.body
        const dialog = await within(
            canvasElement.ownerDocument.body,
        ).findByRole('dialog');
        await userEvent.type(
            dialog.querySelector('[name="name"]'),
            'Tool Change',
        );
        await userEvent.type(dialog.querySelector('[name="content"]'), 'M0');
        await userEvent.click(within(dialog).getByTestId('add-macro-button'));

        await waitFor(() =>
            expect(posted).toMatchObject({
                name: 'Tool Change',
                content: 'M0',
            }),
        );
        await expect(
            await findMacroButton(canvas, 'Tool Change'),
        ).toBeVisible();
    },
};
