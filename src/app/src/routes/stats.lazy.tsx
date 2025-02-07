import { createLazyFileRoute } from '@tanstack/react-router';
import { StatParent } from 'app/features/Stats/StatParent.tsx';

export const Route = createLazyFileRoute('/stats')({
    component: () => StatParent(),
});
