import { createFileRoute } from '@tanstack/react-router';
import { Maintenance } from 'app/features/Stats/Maintenance.tsx';

export const Route = createFileRoute('/stats/maintenance')({
    component: Maintenance,
});
