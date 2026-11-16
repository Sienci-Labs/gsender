import { expect, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import PluginManager from './PluginManager';

const PLUGINS_DIR = '/Users/maker/gSender/plugins';

const plugin = (overrides) => ({
    id: 'probe-helper',
    name: 'Probe Helper',
    version: '1.2.0',
    description: 'Guided probing routines',
    engine: null,
    capabilities: { requestTypes: [], topics: [] },
    permissions: ['machine:read'],
    enabled: true,
    valid: true,
    errors: [],
    mountSlug: 'probe-helper',
    mountRoute: '/plugins/probe-helper',
    uiUrl: '/plugins/probe-helper/ui/index.html',
    contributions: [{ slot: 'tools-tab', label: 'Probe Helper' }],
    ...overrides,
});

const PROBE_HELPER = plugin();
const BROKEN = plugin({
    id: 'broken-plugin',
    name: 'Broken Plugin',
    version: '0.1.0',
    valid: false,
    enabled: false,
    errors: ['gsender-plugin.json: missing "ui" entry'],
    permissions: [],
    contributions: [],
});

// Serves /api/plugins from an in-memory list that PUT and DELETE change, so the
// manager's refresh after each action sees the result
const pluginServer = (msw, initial) => {
    let plugins = initial.map((p) => ({ ...p }));
    const requests = { updates: [], removals: [] };
    msw.use(
        http.get('*/api/plugins', () =>
            HttpResponse.json({
                pluginsDir: PLUGINS_DIR,
                userPluginsDir: PLUGINS_DIR,
                plugins,
            }),
        ),
        http.put('*/api/plugins/:id', async ({ params, request }) => {
            const body = await request.json();
            requests.updates.push({ id: params.id, ...body });
            plugins = plugins.map((p) =>
                p.id === params.id ? { ...p, ...body } : p,
            );
            return HttpResponse.json({ restartRequired: true });
        }),
        http.delete('*/api/plugins/:id', ({ params }) => {
            requests.removals.push(params.id);
            plugins = plugins.filter((p) => p.id !== params.id);
            return HttpResponse.json({});
        }),
    );
    return requests;
};

const meta = {
    component: PluginManager,
    tags: ['ai-generated'],
    parameters: { docs: { story: { inline: false, height: '900px' } } },
    beforeEach: ({ msw, parameters }) => {
        if (parameters.plugins) {
            parameters.pluginRequests = pluginServer(msw, parameters.plugins);
        }
    },
    decorators: [
        (Story) => (
            <div className="h-[700px] w-[1100px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// Each plugin is a bordered card with no role of its own
const card = async (canvas, name) =>
    within((await canvas.findByText(name)).closest('.rounded-md'));

// Each switch is named for its plugin; its visible label only says Enabled/Disabled
const toggle = (scope, name) =>
    scope.getByRole('checkbox', { name: `Enable ${name}` });

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

export const InstalledPlugins = {
    parameters: { plugins: [PROBE_HELPER, BROKEN] },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText(PLUGINS_DIR)).toBeVisible();

        const probe = await card(canvas, 'Probe Helper');
        await expect(probe.getByText('probe-helper · v1.2.0')).toBeVisible();
        await expect(probe.getByText('Slots: tools-tab')).toBeVisible();
        await expect(probe.getByText('machine:read')).toBeVisible();
        await expect(toggle(probe, 'Probe Helper')).toBeChecked();

        // An invalid plugin lists why, and can't be enabled
        const broken = await card(canvas, 'Broken Plugin');
        await expect(
            broken.getByText('gsender-plugin.json: missing "ui" entry'),
        ).toBeVisible();
        await expect(toggle(broken, 'Broken Plugin')).toBeDisabled();
    },
};

export const NoPlugins = {
    parameters: { plugins: [] },
    play: async ({ canvas }) => {
        await expect(
            await canvas.findByText('No plugins installed.'),
        ).toBeVisible();
    },
};

export const LoadFailed = {
    beforeEach: ({ msw }) => {
        msw.use(
            http.get('*/api/plugins', () =>
                HttpResponse.json({}, { status: 500 }),
            ),
        );
    },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText(/status code 500/)).toBeVisible();
    },
};

export const DisablePlugin = {
    parameters: { plugins: [PROBE_HELPER] },
    play: async ({ canvas, parameters, userEvent }) => {
        const probe = await card(canvas, 'Probe Helper');
        await userEvent.click(toggle(probe, 'Probe Helper'));

        await waitFor(() =>
            expect(parameters.pluginRequests.updates).toEqual([
                { id: 'probe-helper', enabled: false },
            ]),
        );
        await waitFor(() =>
            expect(toggle(probe, 'Probe Helper')).not.toBeChecked(),
        );
        await expect(probe.getByText('Disabled')).toBeVisible();
        // Mount routes only change when the server restarts
        await expect(
            await canvas.findByText(/Restart gSender to apply plugin changes/),
        ).toBeVisible();
    },
};

export const UninstallPlugin = {
    parameters: { plugins: [PROBE_HELPER, BROKEN] },
    play: async ({ canvas, canvasElement, parameters, userEvent }) => {
        const probe = await card(canvas, 'Probe Helper');
        await userEvent.click(probe.getByRole('button', { name: 'Uninstall' }));

        const dialog = within(
            await body(canvasElement).findByRole('alertdialog', {
                name: 'Remove Probe Helper?',
            }),
        );
        await userEvent.click(
            dialog.getByRole('button', { name: 'Uninstall' }),
        );

        await waitFor(() =>
            expect(parameters.pluginRequests.removals).toEqual([
                'probe-helper',
            ]),
        );
        // The toast fades in
        const removed = await body(canvasElement).findByText(
            'Probe Helper was removed.',
        );
        await waitFor(() => expect(removed).toBeVisible());
        await waitFor(() =>
            expect(canvas.queryByText('Probe Helper')).toBeNull(),
        );
        await expect(canvas.getByText('Broken Plugin')).toBeVisible();
        await expect(
            canvas.getByText(/Restart gSender to apply plugin changes/),
        ).toBeVisible();
    },
};

export const CancelUninstall = {
    parameters: { plugins: [PROBE_HELPER] },
    play: async ({ canvas, canvasElement, parameters, userEvent }) => {
        const probe = await card(canvas, 'Probe Helper');
        await userEvent.click(probe.getByRole('button', { name: 'Uninstall' }));
        const dialog = within(
            await body(canvasElement).findByRole('alertdialog'),
        );
        await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));

        await waitFor(() =>
            expect(body(canvasElement).queryByRole('alertdialog')).toBeNull(),
        );
        await expect(parameters.pluginRequests.removals).toEqual([]);
        await expect(canvas.getByText('Probe Helper')).toBeVisible();
    },
};

export const InstallNeedsDesktopApp = {
    parameters: { plugins: [] },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(
            await canvas.findByRole('button', { name: 'Install Plugin' }),
        );
        const dialog = within(
            await body(canvasElement).findByRole('dialog', {
                name: 'Install a plugin',
            }),
        );

        // Picking a source opens a native dialog, which only the Electron app has
        await expect(
            dialog.getByText(/Picking a file needs the gSender desktop app/),
        ).toBeVisible();
        await expect(
            dialog.getByRole('button', { name: /From folder/ }),
        ).toBeDisabled();
    },
};
