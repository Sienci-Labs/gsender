import { useEffect } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { useSettings } from '../Config/utils/SettingsContext';
import { NavBar } from './index';

// Marks Config settings as edited-but-unsaved, as editing a setting would
function UnsavedSettings({ children }) {
    const { setSettingsAreDirty } = useSettings();
    useEffect(() => setSettingsAreDirty(true), []);
    return children;
}

// The app uses a HashRouter; start the story on the given route
const startAt = (route) => () => {
    window.location.hash = `#${route}`;
    return () => {
        window.location.hash = '';
    };
};

const meta = {
    component: NavBar,
    tags: ['ai-generated'],
    beforeEach: startAt('/'),
    decorators: [
        (Story) => (
            <div className="flex h-[420px] w-24">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const link = (canvas, name) => canvas.getByRole('link', { name });

export const OnCarve = {
    play: async ({ canvas }) => {
        await expect(link(canvas, 'Carve')).toHaveAttribute(
            'aria-current',
            'page',
        );
        await expect(link(canvas, 'Stats')).not.toHaveAttribute('aria-current');
    },
};

export const Navigate = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(link(canvas, 'Tools'));
        await waitFor(() => expect(window.location.hash).toBe('#/tools'));
        await expect(link(canvas, 'Tools')).toHaveAttribute(
            'aria-current',
            'page',
        );
    },
};

export const LeaveConfigWithUnsavedChanges = {
    beforeEach: startAt('/configuration'),
    decorators: [
        (Story) => (
            <UnsavedSettings>
                <Story />
            </UnsavedSettings>
        ),
    ],
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = within(canvasElement.ownerDocument.body);

        // "No" keeps the user on Config
        await userEvent.click(link(canvas, 'Stats'));
        let dialog = await body.findByRole('alertdialog', {
            name: 'Unsaved Changes',
        });
        await userEvent.click(
            within(dialog).getByRole('button', { name: 'No' }),
        );
        await expect(window.location.hash).toBe('#/configuration');

        // "Yes" discards the changes and navigates. The page stays hidden from
        // assistive tech until the dialog finishes closing, hence findByRole.
        await userEvent.click(
            await canvas.findByRole('link', { name: 'Stats' }),
        );
        dialog = await body.findByRole('alertdialog', {
            name: 'Unsaved Changes',
        });
        await userEvent.click(
            within(dialog).getByRole('button', { name: 'Yes' }),
        );
        await waitFor(() => expect(window.location.hash).toBe('#/stats'));
    },
};

export const LeaveConfigWithoutChanges = {
    beforeEach: startAt('/configuration'),
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(link(canvas, 'Carve'));
        await waitFor(() => expect(window.location.hash).toBe('#/'));
        await expect(
            within(canvasElement.ownerDocument.body).queryByRole('alertdialog'),
        ).toBeNull();
    },
};
