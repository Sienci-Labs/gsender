import { expect, fn } from 'storybook/test';

import Switch from './index';

const meta = {
  component: Switch,
  tags: ['ai-generated'],
  args: { onChange: fn() },
};

export default meta;

export const Off = {
  args: { label: 'Soft Limits', checked: false },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('checkbox', { name: /toggle/i });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything(), expect.anything());
  },
};

export const On = { args: { label: 'Soft Limits', checked: true } };

export const WithSecondaryLabel = {
  args: { label: 'Inches', secondaryLabel: 'Millimeters', checked: true },
};

export const Vertical = { args: { checked: true, position: 'vertical' } };

export const Disabled = { args: { label: 'Homing', disabled: true } };
