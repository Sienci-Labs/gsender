import { createFileRoute } from '@tanstack/react-router';
import { Alarms } from 'app/features/Stats/Alarms.tsx';

export const Route = createFileRoute('/stats/alarms')({
    component: Alarms,
});
