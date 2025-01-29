import { createLazyFileRoute } from '@tanstack/react-router';
import MovementTuning from 'app/features/MovementTuning';

export const Route = createLazyFileRoute('/movement-tuning')({
    component: MovementTuningPage,
});

function MovementTuningPage() {
    return (
        <div className="p-4">
            <MovementTuning />
        </div>
    );
}
