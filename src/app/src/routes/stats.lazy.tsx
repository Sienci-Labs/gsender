import { createLazyFileRoute } from '@tanstack/react-router';
import { Stats } from 'app/features/Stats';

export const Route = createLazyFileRoute('/stats')({
    component: () => Stats(),
});
