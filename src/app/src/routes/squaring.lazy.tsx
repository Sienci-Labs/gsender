import { createLazyFileRoute } from '@tanstack/react-router';

import Squaring from 'app/features/Squaring';
// import Squaring from 'app/features/Squaring/old';

export const Route = createLazyFileRoute('/squaring')({
    component: SquaringPage,
});

function SquaringPage() {
    return (
        <div className="p-4">
            <Squaring />
        </div>
    );
}
