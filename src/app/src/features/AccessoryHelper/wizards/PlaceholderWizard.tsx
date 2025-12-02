import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import CAT from './assets/cat.webp';

export const PlaceholderWizard: Wizard = {
    category: 'Thing',
    description:
        'A symmetrical third thing that I can put here to take up space.',
    estimatedTime: '0-5 minutes',
    id: 'cat',
    name: 'A Sample Wizard',
    requiredItems: [],
    steps: [],
    thumbnail: CAT,
};
