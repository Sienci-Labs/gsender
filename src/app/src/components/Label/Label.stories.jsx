import { Label } from './index';

const meta = {
  component: Label,
  tags: ['ai-generated'],
};

export default meta;

export const Default = { args: { children: 'Feed Rate' } };

export const CustomClass = {
  args: { children: 'Spindle Speed', className: 'text-blue-500 font-bold' },
};
