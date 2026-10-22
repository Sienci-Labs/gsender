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
    // The visible label names the checkbox
    const toggle = canvas.getByRole('checkbox', { name: 'Soft Limits' });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything(), expect.anything());
  },
};

export const On = { args: { label: 'Soft Limits', checked: true } };

export const WithSecondaryLabel = {
  args: { label: 'Inches', secondaryLabel: 'Millimeters', checked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Inches' })).toBeChecked();
  },
};

export const WithAriaLabel = {
  // A visible label that describes the state needs a name that says what it controls
  args: { label: 'Enabled', ariaLabel: 'Enable Probe Helper', checked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Enable Probe Helper' })).toBeChecked();
    await expect(canvas.getByText('Enabled')).toBeVisible();
  },
};

export const Vertical = {
  args: { checked: true, position: 'vertical' },
  play: async ({ canvas }) => {
    // With no label at all there is nothing better to call it
    await expect(canvas.getByRole('checkbox', { name: 'Toggle' })).toBeChecked();
  },
};

export const Disabled = { args: { label: 'Homing', disabled: true } };
