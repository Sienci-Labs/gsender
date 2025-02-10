import { createLazyFileRoute } from '@tanstack/react-router';

import KeyboardShortcuts from '../features/Keyboard';

export const Route = createLazyFileRoute('/keyboard-shortcuts')({
    component: KeyboardShortcutsPage,
});

function KeyboardShortcutsPage() {
    return (
        <div className="p-4">
            <KeyboardShortcuts />
        </div>
    );
}
