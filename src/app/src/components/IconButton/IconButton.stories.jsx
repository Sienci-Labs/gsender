import { MdHome, MdRefresh } from 'react-icons/md';

import { IconButton } from './index';

const meta = {
    component: IconButton,
    tags: ['ai-generated'],
};

export default meta;

export const Default = { args: { icon: <MdHome />, children: 'Home' } };

export const IconOnly = {
    args: { icon: <MdRefresh />, 'aria-label': 'Refresh' },
};

export const Disabled = {
    args: { icon: <MdHome />, children: 'Home', disabled: true },
};
