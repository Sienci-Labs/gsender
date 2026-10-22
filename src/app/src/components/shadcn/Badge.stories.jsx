import { Badge } from './Badge';

const meta = {
  component: Badge,
  tags: ['ai-generated'],
};

export default meta;

export const Default = { args: { children: 'Connected' } };

export const Secondary = { args: { variant: 'secondary', children: 'Idle' } };

export const Destructive = { args: { variant: 'destructive', children: 'Alarm' } };

export const Outline = { args: { variant: 'outline', children: 'v1.6.4' } };
