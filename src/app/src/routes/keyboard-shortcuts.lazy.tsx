import { createLazyFileRoute } from '@tanstack/react-router';

import Page from 'app/components/Page';

import KeyboardShortcuts from '../features/Keyboard';

export const Route = createLazyFileRoute('/keyboard-shortcuts')({
    component: KeyboardShortcutsPage,
});

function KeyboardShortcutsPage() {
    return (
        <Page title="Keyboard Shortcuts" withGoBackButton>
            <KeyboardShortcuts />
        </Page>
    );
}
