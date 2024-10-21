import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/stats')({
    component: () => StatsAndInfo(),
});

function StatsAndInfo() {
    return <div>Stats and Info Section</div>;
}
