import { createFileRoute } from '@tanstack/react-router';
import { Stats } from 'app/features/Stats';

export const Route = createFileRoute('/stats/')({
    component: Stats,
});
