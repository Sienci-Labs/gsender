/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useAppTranslation } from 'app/i18n';
import { useEffect } from 'react';

interface Props {
    onComplete: () => void;
}

const Landing = ({ onComplete }: Props) => {
    const { t } = useAppTranslation();
    useEffect(() => {
        onComplete();
    }, []);

    return (
        <div className="flex flex-col gap-4 xl:gap-0">
            <div className="space-y-12 text-sm xl:text-base font-normal">
                <div className="mb-2 dark:text-content-primary">
                    {t('tools:squaring.landing.prepare')}
                    <ul className="list-disc list-inside">
                        <li>{t('tools:squaring.landing.tape')}</li>
                        <li>{t('tools:squaring.landing.ruler')}</li>
                        <li>{t('tools:squaring.landing.pointer')}</li>
                    </ul>
                </div>

                <p className="mb-2 dark:text-content-primary">
                    {t('tools:squaring.landing.position')}
                </p>
            </div>
        </div>
    );
};

export default Landing;
