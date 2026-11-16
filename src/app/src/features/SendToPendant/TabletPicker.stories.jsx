import { expect, fn } from 'storybook/test';

import { TabletPicker } from './TabletPicker';

const SHOP = {
    id: 'tab-shop',
    name: 'Shop Tablet',
    host: '192.168.0.50',
    port: 8010,
    key: 'key-shop',
    paired: true,
    online: true,
};
const GARAGE = {
    id: 'tab-garage',
    name: 'Garage Pendant',
    host: '192.168.0.61',
    port: 8010,
    key: 'key-garage',
    paired: true,
    online: false,
};

const TABLET_SETS = {
    none: [],
    'one online': [SHOP],
    'one offline': [GARAGE],
    several: [SHOP, GARAGE],
};

const meta = {
    component: TabletPicker,
    tags: ['ai-generated'],
    args: {
        tablets: 'one online',
        selectedId: 'tab-shop',
        disabled: false,
        onSelect: fn(),
        onPairNew: fn(),
        onPairManual: fn(),
        onForget: fn(),
    },
    argTypes: {
        tablets: {
            description: 'Paired tablets the desktop knows about',
            control: { type: 'select' },
            options: Object.keys(TABLET_SETS),
            mapping: TABLET_SETS,
        },
        selectedId: {
            control: { type: 'select' },
            options: [null, 'tab-shop', 'tab-garage'],
        },
        disabled: {
            description: 'Set while a send is in progress',
            control: { type: 'boolean' },
        },
    },
    decorators: [
        (Story) => (
            <div className="w-[420px] p-2 text-sm">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const NoTablets = {
    args: { tablets: 'none', selectedId: null },
    play: async ({ args, canvas, userEvent }) => {
        await expect(canvas.getByText('No pendant paired yet')).toBeVisible();
        await userEvent.click(
            canvas.getByRole('button', { name: 'Pair with QR code' }),
        );
        await expect(args.onPairNew).toHaveBeenCalled();
        await userEvent.click(
            canvas.getByRole('button', { name: /Enter IP & code instead/ }),
        );
        await expect(args.onPairManual).toHaveBeenCalled();
    },
};

export const NoTabletsDisabled = {
    args: { tablets: 'none', selectedId: null, disabled: true },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Pair with QR code' }),
        ).toBeDisabled();
    },
};

export const OneTabletOnline = {
    play: async ({ args, canvas, userEvent }) => {
        await expect(canvas.getByText('Shop Tablet')).toBeVisible();
        await expect(canvas.getByText('Online')).toBeVisible();
        // With a single tablet there is nothing to change to, only forget
        await userEvent.click(
            canvas.getByRole('button', { name: 'Forget this tablet' }),
        );
        await expect(args.onForget).toHaveBeenCalledWith('tab-shop');
    },
};

export const OneTabletOffline = {
    args: { tablets: 'one offline', selectedId: 'tab-garage' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Offline')).toBeVisible();
        await expect(
            canvas.getByText(/last seen\s+192\.168\.0\.61/),
        ).toBeVisible();
    },
};

export const SeveralTablets = {
    args: { tablets: 'several' },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: /Change/ }));
        await userEvent.click(
            canvas.getByRole('button', { name: /Garage Pendant/ }),
        );
        await expect(args.onSelect).toHaveBeenCalledWith('tab-garage');
    },
};

export const SeveralTabletsExpanded = {
    args: { tablets: 'several' },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: /Change/ }));
        await expect(
            canvas.getByRole('button', { name: /Garage Pendant/ }),
        ).toBeVisible();
    },
};

export const NothingSelected = {
    args: { tablets: 'several', selectedId: null },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Choose a tablet')).toBeVisible();
    },
};

export const Sending = {
    args: { tablets: 'several', disabled: true },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: /Change/ }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('button', { name: /Pair another tablet/ }),
        ).toBeDisabled();
    },
};
