import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { TranslationKey } from './index';
import { NAMESPACES } from './locales/en';

/**
 * useTranslation() for gSender. Loads every namespace so prefixed keys
 * (`t('config:row.resetTitle')`, with or without options) type-check — the
 * app compiles with strictNullChecks off, where i18next's types need this form.
 */
export const useAppTranslation = () => useTranslation(NAMESPACES);

interface TransKeyProps {
    i18nKey: TranslationKey;
    values?: Record<string, unknown>;
    components?: Record<string, ReactElement> | ReactElement[];
    count?: number;
}

/**
 * <Trans> with a type-checked key. react-i18next's own i18nKey type collapses
 * to `never` without strictNullChecks.
 *
 * <TransKey i18nKey="config:restoreDefaults.confirm" values={{ name }}
 *           components={{ bold: <strong /> }} />
 */
export function TransKey({ i18nKey, ...props }: TransKeyProps): ReactElement {
    const { t } = useAppTranslation();
    // biome-ignore lint/suspicious/noExplicitAny: key is checked by TransKeyProps
    return (
        <Trans t={t as any} i18nKey={i18nKey as never} {...(props as any)} />
    );
}
