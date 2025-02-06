import { createFileRoute } from '@tanstack/react-router';
import { Jobs } from 'app/features/Stats/Jobs.tsx';

export const Route = createFileRoute('/stats/jobs')({
    component: Jobs,
});
