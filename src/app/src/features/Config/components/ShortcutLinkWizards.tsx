import { ToolLink } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';

export function GamepadLinkWizard() {
    return <ToolLink label="Configure Gamepad" link={'/gamepad'} />;
}

export function KeyboardLinkWizard() {
    return <ToolLink label="Configure Keyboard" link={'/keyboard-shortcuts'} />;
}
