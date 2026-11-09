import { useAppTranslation } from 'app/i18n';
import { ToolLink } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';

export function GamepadLinkWizard() {
    const { t } = useAppTranslation();
    return (
        <ToolLink
            label={t('config:wizards.configureGamepad')}
            link={'/tools/gamepad'}
        />
    );
}

export function KeyboardLinkWizard() {
    const { t } = useAppTranslation();
    return (
        <ToolLink
            label={t('config:wizards.configureKeyboard')}
            link={'/tools/keyboard-shortcuts'}
        />
    );
}
