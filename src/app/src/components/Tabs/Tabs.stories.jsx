import { expect } from 'storybook/test';

import { Tabs } from './index';

const Panel = (text) => () => <p className="p-4">{text}</p>;

const meta = {
  component: Tabs,
  tags: ['ai-generated'],
  decorators: [
    // Tab strip is absolutely positioned above the panel (top-[-41px])
    (Story) => (
      <div className="pt-14">
        <Story />
      </div>
    ),
  ],
  args: {
    items: [
      { label: 'Probe', content: Panel('Probe settings') },
      { label: 'Macros', content: Panel('Macro list') },
      { label: 'Console', content: Panel('Console output') },
    ],
  },
};

export default meta;

export const Default = {
  play: async ({ canvas, userEvent }) => {
    const macrosTab = canvas.getByRole('tab', { name: 'Macros' });
    await expect(macrosTab).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(macrosTab);
    await expect(macrosTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('Macro list')).toBeVisible();
    await expect(canvas.queryByText('Probe settings')).not.toBeVisible();
  },
};

export const SingleTab = {
  args: { items: [{ label: 'Probe', content: Panel('Probe settings') }] },
};
