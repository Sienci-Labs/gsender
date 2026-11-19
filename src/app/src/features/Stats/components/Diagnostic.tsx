import { useAppTranslation } from 'app/i18n';
import generateSupportFile from 'app/lib/diagnostics.tsx';

interface DiagnosticProps {
    compactOnSmall?: boolean;
}

export function Diagnostic({ compactOnSmall = false }: DiagnosticProps) {
    const { t } = useAppTranslation();
    return (
        <div
            className={`flex flex-col gap-4 ${
                compactOnSmall ? 'h-full max-xl:justify-center' : ''
            }`}
        >
            <p
                className={`text-gray-600 text-sm dark:text-content-primary ${
                    compactOnSmall ? 'max-xl:hidden' : ''
                }`}
            >
                {t('stats:diagnostic.description')}
            </p>
            {generateSupportFile()}
        </div>
    );
}
