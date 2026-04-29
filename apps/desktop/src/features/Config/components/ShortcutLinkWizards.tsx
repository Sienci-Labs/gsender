import { ToolLink } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';

export function GamepadLinkWizard() {
    return <ToolLink label="Configure Gamepad" link={'/tools/gamepad'} />;
}

export function KeyboardLinkWizard() {
    return (
        <ToolLink
            label="Configure Keyboard"
            link={'/tools/keyboard-shortcuts'}
        />
    );
}
